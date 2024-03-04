import {
  type Accessor,
  type ParentComponent,
  createEffect,
  createRenderEffect,
  on,
  onCleanup,
  onMount,
  untrack,
  createRoot,
  runWithOwner,
} from 'solid-js';
import { mergeProps, createMemo, createSignal, createComputed } from 'solid-js';
import { createStore, produce } from 'solid-js/store';
import { Dynamic } from 'solid-js/web';

import type { Direction, LayoutItem } from './types';

import { newStateAlgorithm } from './store/algorithm';
import { PanelContext } from './context';
import { preprocessLayout } from './utils/preprocess-layout';
import { CLASSNAMES, TOTAL_FLEX_GROW } from './constants';
import { isHorizontalDirection, isReverseDirection } from './utils/direction';
import { roundTo4Digits } from './utils/math';
import { useTotalPanelSizePX } from './hooks/use-panel-size';
import { createMouseDelta } from './utils/mouse-delta';

export type PagelGroupAPI = {
  getStaticLayout(): number[];
  getSignalLayout(): Accessor<number[]>;
  setLayout(layout: number[]): void;
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
   * @default 1
   */
  zoom?: number;
  /**
   * If the parent element has CSS scale property
   * The scale value should be passed to eliminate visual bugs during resizing
   * @default 1
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
   * API setter for the parent component
   * You can use this API to get and set the layout of the panels
   */
  api?: (api: PagelGroupAPI) => void;
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
  resizeAlgorithm?: (
    /** Current state of layout */
    resolvedLayout: {
      id: string;
      size: number;
      minSize: number;
      maxSize: number;
      collapsible: boolean;
    }[],
    /** Sizes on resize start */
    sizesOnResizeStart: number[],
    resizableItemIndex: number,
    /**
     * Delta size is computed from the initial size (before resize) and current state
     */
    deltaSize: number,
  ) => number[];
}

const useProcessedLayout = () => {
  const [initialLayout, setInitialLayout] = createSignal<LayoutItem[]>([]);
  const processedLayout = createMemo(() => preprocessLayout(initialLayout()));

  const addLayoutItem = (data: LayoutItem, index?: number) =>
    setInitialLayout((layout) => {
      const newLayout = [...layout];

      if (index) newLayout.splice(index, 0, data);
      else newLayout.push(data);

      return newLayout;
    });

  const removeLayoutItem = (panelId: string) =>
    setInitialLayout((layout) => layout.filter((data) => data.id !== panelId));

  return { processedLayout, addLayoutItem, removeLayoutItem };
};

export const PanelGroup: ParentComponent<PanelGroupProps> = (initialProps) => {
  const props = mergeProps(
    {
      tag: 'div',
      zoom: 1,
      scale: 1,
      direction: 'row' as Direction,
      resizeAlgorithm: newStateAlgorithm,
    } satisfies Partial<PanelGroupProps>,
    initialProps,
  );

  const [containerRef, setContainerRef] = createSignal<HTMLElement | undefined>();
  const { processedLayout, addLayoutItem, removeLayoutItem } = useProcessedLayout();
  const [$state, setState] = createStore({ layout: processedLayout() }, { name: 'PanelStore' });

  // Sync store with layout changes (like panel addition/removing)
  createComputed(
    on(processedLayout, (currentProcessedLayout) => setState({ layout: currentProcessedLayout }), {
      defer: true,
    }),
  );

  const mouseDelta = createMouseDelta({
    zoom: () => props.zoom,
    scale: () => props.scale,
  });

  const createMouseDownHandler = (panelId: string, e: MouseEvent) => {
    mouseDelta.init(e);

    const dispose = createRoot((dispose) => {
      const totalPanelSizePX = useTotalPanelSizePX(
        containerRef,
        () => $state.layout.length,
        () => props.direction,
      );

      const flexGrowOnResizeStart = $state.layout.map((item) => item.size);
      // There things are not reactive during resize
      const isHorizontal = isHorizontalDirection(props.direction);
      const reverseSign = isReverseDirection(props.direction) ? -1 : 1;

      const deltaPX = () =>
        (isHorizontal ? mouseDelta.deltaX() : mouseDelta.deltaY()) * reverseSign;

      createEffect(
        on(deltaPX, (currentDeltaPX) => {
          const deltaFlexGrow = (currentDeltaPX * TOTAL_FLEX_GROW) / totalPanelSizePX();

          if (deltaFlexGrow !== 0) {
            const resizableItemIndex = $state.layout.findIndex((item) => item.id === panelId);

            // TODO handle error somehow
            if (resizableItemIndex === -1) return;

            const newState = props
              .resizeAlgorithm(
                $state.layout,
                flexGrowOnResizeStart,
                resizableItemIndex,
                deltaFlexGrow,
                // round values
              )
              .map(roundTo4Digits);

            setState(
              produce((state) => {
                for (let i = 0; i < newState.length; i++) {
                  // hate TS for this
                  if (newState[i] !== undefined) state.layout[i].size = newState[i]!;
                }
              }),
            );

            props.onLayoutChange?.(newState);
          }
        }),
      );

      return dispose;
    });

    const handleMouseMove = (e: MouseEvent) => mouseDelta.updateMouseDelta(e);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', dispose, { once: true });

    runWithOwner(
      null,
      onCleanup(() => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', dispose);
      }),
    );
  };

  createRenderEffect(
    on(
      () => props.api,
      (apiSetter) => {
        if (!apiSetter) return;

        apiSetter({
          getStaticLayout: () => untrack(() => $state.layout.map((item) => item.size)),
          getSignalLayout: () => createMemo(() => $state.layout.map(($item) => $item.size)),
          setLayout: (sizes: number[]) =>
            untrack(() => {
              if ($state.layout.length !== sizes.length)
                throw new Error('Layout and sizes length mismatch');
              if (sizes.reduce((acc, size) => acc + size, 0) !== 100)
                throw new Error('Sizes should sum to 100 (100%)');

              setState(
                produce((state) => {
                  for (let i = 0; i < sizes.length; i++) state.layout[i].size = sizes[i];
                }),
              );
            }),
        });
      },
    ),
  );

  // Removed flickering (when SSR)
  // The point is that initial sizes are not defined
  // So we need to mount elements and then compute their sizes
  // This causes flickering so we need to show the content only after mount
  const [isContentVisible, setContentVisible] = createSignal(false);
  onMount(() => setContentVisible(true));

  return (
    <PanelContext.Provider
      value={{
        registerPanel: addLayoutItem,
        unregisterPanel: removeLayoutItem,
        useData: (panelId) => createMemo(() => $state.layout.find((item) => item.id === panelId)),
        createMouseDownHandler,
      }}
    >
      <Dynamic
        ref={setContainerRef}
        component={props.tag}
        style={{
          'flex-direction': props.direction,
          visibility: isContentVisible() ? '' : 'hidden',
        }}
        classList={{
          [CLASSNAMES.panelGroup]: true,
          [CLASSNAMES.panelGroupVertical]: !isHorizontalDirection(props.direction),
          [props.class ?? '']: true,
        }}
      >
        {props.children}
      </Dynamic>
    </PanelContext.Provider>
  );
};
