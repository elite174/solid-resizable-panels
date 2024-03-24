import {
  type ParentComponent,
  createEffect,
  createComputed,
  on,
  onCleanup,
  onMount,
  untrack,
  createRoot,
  createContext,
  mergeProps,
  createSignal,
} from "solid-js";

import { createStore, produce } from "solid-js/store";
import { Dynamic } from "solid-js/web";

import type { Direction, LayoutItem } from "./types";

import { RESIZE_ALGORITHM, type ResizeAlgorithm } from "./resize-algorithm/algorithm";
import { preprocessLayout } from "./utils/preprocess-layout";
import { CLASSNAMES, TOTAL_FLEX_GROW } from "./constants";
import { isHorizontalDirection } from "./utils/direction";
import { roundTo4Digits } from "./utils/math";
import { createTotalPanelSizePX } from "./hooks/create-total-panel-size";
import { createMouseDelta } from "./utils/mouse-delta";
import { makeLogText } from "./utils/log";

export interface Logger {
  warn(message: string): void;
  error(message: string): void;
}

export interface IPanelContext {
  logger?: Logger;
  registerPanel: (panelData: LayoutItem, index?: number) => void;
  unregisterPanel: (panelId: string) => void;
  getPanelSize: (panelId: string) => number | undefined;
  onPanelResizeStart: (panelId: string, e: MouseEvent) => void;
}

export type PanelGroupAPI = {
  /**
   * Returns the current layout of the panels
   */
  getLayout(): number[];
  /**
   * Set the layout of the panels
   * The layout should be aligned with configuration of the panels (minSize, maxSize, collapsible and etc.)
   */
  setLayout(layout: number[]): void;
  /**
   * Trying to collapse the panel to it's minSize
   */
  collapse(panelId: string): void;
  /**
   * Expand the panel to its maximum possible size
   * You can also pass the size to expand the panel to
   * (it should be between minSize and maxSize)
   */
  expand(panelId: string, expandSize?: number): void;
};

export interface PanelGroupProps {
  /**
   * A flex-direction property applied to the element
   * @default "row"
   */
  direction?: Direction;
  /**
   * If the parent element has CSS zoom property
   * The zoom value should be passed to eliminate visual bugs during resizing
   */
  zoom?: number;
  /**
   * If the parent element has CSS scale property
   * The scale value should be passed to eliminate visual bugs during resizing
   */
  scale?: number;
  /**
   * Rendered HTML tag
   * @default "div"
   */
  tag?: string;
  /**
   * Extra class passed to panel DOM element.
   */
  class?: string;
  /**
   * A logger to be used for diagnostic messages
   */
  logger?: Logger;
  /**
   * API setter for the parent component
   * You can use this API to get and set the layout of the panels
   */
  setAPI?: (api: PanelGroupAPI) => void;
  /**
   * A callback called during resize
   */
  onLayoutChange?: (sizes: number[]) => void;
  /**
   * You can pass custom resize algorithm and implemenent custom resize logic
   * This algorithm is called every time on items resize (mousemove or touchmove)
   * So it should return the final state of the items
   *
   * @returns The sizes of the items on the current resize event (mousemove or touchmove)
   */
  resizeAlgorithm?: ResizeAlgorithm;
}

export const PanelContext = createContext<IPanelContext>();

const isReverseDirection = (direction: Direction) => direction.endsWith("reverse");

const createProcessedLayout = (logger?: Logger) => {
  const [initialLayout, setInitialLayout] = createSignal<LayoutItem[]>([]);
  const [$processedLayout, setProcessedLayout] = createStore(preprocessLayout(initialLayout(), logger));

  // Sync store with layout changes (like panel addition/removing)
  createComputed(
    on(initialLayout, (layoutToProcess) => setProcessedLayout(preprocessLayout(layoutToProcess)), {
      defer: true,
    })
  );

  const addLayoutItem = (data: LayoutItem, index?: number) =>
    setInitialLayout((layout) => {
      const newLayout = [...layout];

      if (index !== undefined) newLayout.splice(index, 0, data);
      else newLayout.push(data);

      return newLayout;
    });

  const removeLayoutItem = (panelId: string) =>
    setInitialLayout((layout) => layout.filter((data) => data.id !== panelId));

  return { $processedLayout, setProcessedLayout, addLayoutItem, removeLayoutItem };
};

export const PanelGroup: ParentComponent<PanelGroupProps> = (initialProps) => {
  const props = mergeProps(
    {
      tag: "div",
      direction: "row",
      resizeAlgorithm: RESIZE_ALGORITHM,
    } satisfies Partial<PanelGroupProps>,
    initialProps
  );

  // Removed flickering (when SSR)
  // The point is that initial sizes are not defined
  // So we need to mount elements and then compute their sizes
  // This causes flickering so we need to show the content only after mount
  const [isContentVisible, setContentVisible] = createSignal(false);

  const [containerRef, setContainerRef] = createSignal<HTMLElement | undefined>();
  const { $processedLayout, setProcessedLayout, addLayoutItem, removeLayoutItem } = createProcessedLayout(props.logger);

  // layout is only computed when all panels are mounted.
  // until then we can't do anything with layout
  onMount(() => {
    // Start listen to layout changes
    createEffect(
      on(
        () => $processedLayout.map((item) => item.size),
        (layout) => props.onLayoutChange?.(layout),
        { defer: true }
      )
    );

    createEffect(
      on(
        () => props.setAPI,
        (apiSetter) => {
          if (!apiSetter) return;

          apiSetter({
            getLayout: () => untrack(() => $processedLayout.map((item) => item.size)),
            collapse: (panelId) =>
              untrack(() => {
                const panel = $processedLayout.find((item) => item.id === panelId);

                if (!panel) return;
                if (panel.size === 0) return;

                // try to collapse this panel and recompute layout
                const newState = props
                  .resizeAlgorithm(
                    $processedLayout,
                    $processedLayout.map((item) => item.size),
                    $processedLayout.findIndex((item) => item.id === panelId),
                    -(panel.collapsible ? panel.size : panel.size - panel.minSize)
                  )
                  .map(roundTo4Digits);

                setProcessedLayout(
                  produce((layout) => {
                    for (let i = 0; i < newState.length; i++) layout[i].size = newState[i];
                  })
                );
              }),
            expand: (panelId, sizeToExpand?: number) =>
              untrack(() => {
                const panel = $processedLayout.find((item) => item.id === panelId);

                if (!panel) return;
                if (!panel.collapsible) return;
                if (panel.size !== 0) return;

                const expandSize =
                  sizeToExpand !== undefined
                    ? sizeToExpand >= panel.minSize && sizeToExpand <= panel.maxSize
                      ? sizeToExpand
                      : panel.size
                    : panel.maxSize;

                // try to expand this panel and recompute layout
                const newState = props
                  .resizeAlgorithm(
                    $processedLayout,
                    $processedLayout.map((item) => item.size),
                    $processedLayout.findIndex((item) => item.id === panelId),
                    expandSize
                  )
                  .map(roundTo4Digits);

                setProcessedLayout(
                  produce((layout) => {
                    for (let i = 0; i < newState.length; i++) layout[i].size = newState[i];
                  })
                );
              }),
            setLayout: (sizes: number[]) =>
              untrack(() => {
                if ($processedLayout.length !== sizes.length) {
                  props.logger?.error(makeLogText("Layout and sizes length mismatch"));
                  return;
                }
                if (sizes.reduce((acc, size) => acc + size, 0) !== 100) {
                  props.logger?.error(makeLogText("Sizes should sum to 100 (100%)"));
                  return;
                }
                // Check minSize and maxSize
                for (let i = 0; i < sizes.length; i++) {
                  if (sizes[i] < $processedLayout[i].minSize) {
                    props.logger?.error(
                      makeLogText(`Size ${sizes[i]} is less than minSize ${$processedLayout[i].minSize}`)
                    );
                    return;
                  }
                  if (sizes[i] > $processedLayout[i].maxSize) {
                    props.logger?.error(
                      makeLogText(`Size ${sizes[i]} is greater than maxSize ${$processedLayout[i].maxSize}`)
                    );
                    return;
                  }
                }

                setProcessedLayout(
                  produce((layout) => {
                    for (let i = 0; i < sizes.length; i++) layout[i].size = sizes[i];
                  })
                );
              }),
          });
        }
      )
    );

    setContentVisible(true);
  });

  return (
    <PanelContext.Provider
      value={{
        logger: props.logger,
        registerPanel: addLayoutItem,
        unregisterPanel: removeLayoutItem,
        // Size can be unresolved, because layout has not been computed yet
        // TODO: find a way to get rid of these checks
        getPanelSize: (panelId) => $processedLayout.find((item) => item.id === panelId)?.size,
        onPanelResizeStart: (panelId: string, e: MouseEvent) => {
          // Dispose this when the component is unmounted?
          createRoot((dispose) => {
            const mouseDelta = createMouseDelta({
              zoom: () => props.zoom,
              scale: () => props.scale,
            });

            mouseDelta.init(e);

            const totalPanelSizePX = createTotalPanelSizePX(
              containerRef,
              () => $processedLayout.length,
              () => props.direction
            );

            const flexGrowOnResizeStart = $processedLayout.map((item) => item.size);
            // There things are not reactive during resize
            const isHorizontal = isHorizontalDirection(props.direction);
            const reverseSign = isReverseDirection(props.direction) ? -1 : 1;

            const deltaPX = () => (isHorizontal ? mouseDelta.deltaX() : mouseDelta.deltaY()) * reverseSign;

            createEffect(
              on(deltaPX, (currentDeltaPX) => {
                const deltaFlexGrow = (currentDeltaPX * TOTAL_FLEX_GROW) / totalPanelSizePX();

                if (deltaFlexGrow !== 0) {
                  const resizableItemIndex = $processedLayout.findIndex((item) => item.id === panelId);

                  // TODO handle error somehow
                  if (resizableItemIndex === -1) return;

                  const newState = props
                    .resizeAlgorithm(
                      $processedLayout,
                      flexGrowOnResizeStart,
                      resizableItemIndex,
                      deltaFlexGrow
                      // round values
                    )
                    .map(roundTo4Digits);

                  setProcessedLayout(
                    produce((layout) => {
                      for (let i = 0; i < newState.length; i++)
                        if (newState[i] !== undefined) layout[i].size = newState[i];
                    })
                  );
                }
              })
            );

            const handleMouseMove = (e: MouseEvent) => mouseDelta.updateMouseDelta(e);

            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", dispose, { once: true });

            onCleanup(() => {
              document.removeEventListener("mousemove", handleMouseMove);
              document.removeEventListener("mouseup", dispose);
            });
          });
        },
      }}
    >
      <Dynamic
        ref={setContainerRef}
        component={props.tag}
        style={{
          "flex-direction": props.direction,
          visibility: isContentVisible() ? "" : "hidden",
        }}
        classList={{
          [CLASSNAMES.panelGroup]: true,
          [CLASSNAMES.panelGroupVertical]: !isHorizontalDirection(props.direction),
          [props.class ?? ""]: true,
        }}
      >
        {props.children}
      </Dynamic>
    </PanelContext.Provider>
  );
};
