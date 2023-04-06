import { ParentComponent, onMount } from 'solid-js';
import { mergeProps, createMemo, createSignal, createComputed } from 'solid-js';
import { createStore, produce } from 'solid-js/store';
import { Dynamic } from 'solid-js/web';

import { useResize } from './hooks/use-resize';
import { createPanelStore } from './store';
import type { Direction, LayoutItem } from './types';

import { PanelContext } from './context';
import type { IPanelContext } from './context';
import { preprocessLayout } from './utils/preprocess-layout';
import { CLASSNAMES } from './constants';
import { isHorizontalDirection } from './utils/direction';

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

export const PanelGroup: ParentComponent<PanelGroupProps> = (initialProps) => {
  const props = mergeProps(
    {
      tag: 'div',
      zoom: 1,
      scale: 1,
      direction: 'row' as Direction,
    },
    initialProps,
  );

  const [containerRef, setContainerRef] = createSignal<HTMLElement | undefined>();

  const [initialLayout, setInitialLayout] = createStore<LayoutItem[]>([]);

  const processedLayout = createMemo(() => preprocessLayout(initialLayout));

  const { state, setConfig, updateLayout } = createPanelStore(
    processedLayout(),
    () => props.resizeAlgorithm,
    props.onLayoutChange,
  );

  createComputed(() => {
    setConfig(processedLayout());
  });

  const registerPanel: IPanelContext['registerPanel'] = (data, index) =>
    setInitialLayout(
      produce((layout) => {
        if (index) {
          layout.splice(index, 0, data);
        } else {
          layout.push(data);
        }
      }),
    );

  const unregisterPanel: IPanelContext['unregisterPanel'] = (panelId) => {
    setInitialLayout(
      produce((layout) => {
        layout = layout.filter((data) => data.id !== panelId);
      }),
    );
  };

  const useData: IPanelContext['useData'] = (panelId) =>
    createMemo(() => state.layout.find((item) => item.id === panelId));

  const createMouseDownHandler = useResize({
    zoom: () => props.zoom,
    scale: () => props.scale,
    direction: () => props.direction,
    state: () => state,
    containerRef,
    updateLayout,
  });

  const [isContentVisible, setContentVisible] = createSignal(false);

  // Removed flickering (when SSR)
  // The point is that initial sizes are not defined
  // So we need to mount elements and then compute their sizes
  // This causes flickering so we need to show the content only after mount
  onMount(() => setContentVisible(true));

  const contentVisibility = () => (isContentVisible() ? '' : 'hidden');

  return (
    <PanelContext.Provider
      value={{
        registerPanel,
        unregisterPanel,
        useData,
        createMouseDownHandler,
      }}
    >
      <Dynamic
        ref={setContainerRef}
        component={props.tag}
        style={{ 'flex-direction': props.direction, visibility: contentVisibility() }}
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
