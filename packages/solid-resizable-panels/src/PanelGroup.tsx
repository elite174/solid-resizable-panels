import { mergeProps, ParentComponent, createMemo, createSignal, createComputed } from 'solid-js';
import { createStore, produce } from 'solid-js/store';
import { Dynamic } from 'solid-js/web';

import { useResize } from './hooks/use-resize';
import { createPanelStore } from './store';
import type { Direction, LayoutItem } from './types';

import { PanelContext } from './context';
import type { IPanelContext } from './context';
import { preprocessLayout } from './utils/preprocess-layout';
import { CLASSNAMES } from './constants';
import { isHorizontalDirection } from './utils/misc';

interface PanelGroupProps {
  direction?: Direction;
  tag?: string;
  class?: string;
  zoom?: number;
  scale?: number;
}

export const PanelGroup: ParentComponent<PanelGroupProps> = (initialProps) => {
  const props = mergeProps(
    {
      tag: 'div',
      zoom: 1,
      scale: 1,
      direction: 'row' as Direction,
      reverse: false,
    },
    initialProps,
  );

  const [containerRef, setContainerRef] = createSignal<HTMLElement | undefined>();

  const [initialLayout, setInitialLayout] = createStore<LayoutItem[]>([]);

  const processedLayout = createMemo(() => preprocessLayout(initialLayout));

  const { state, setConfig, onLayoutChange } = createPanelStore(processedLayout());

  createComputed(() => {
    setConfig(processedLayout());
  });

  let lastRegisterPanelId = '';

  const registerPanel: IPanelContext['registerPanel'] = (data, index) => {
    setInitialLayout(
      produce((layout) => {
        if (index) {
          layout.splice(index, 0, data);
        } else {
          layout.push(data);
        }
      }),
    );

    lastRegisterPanelId = data.id;
  };

  const unregisterPanel: IPanelContext['unregisterPanel'] = (panelId) => {
    setInitialLayout(
      produce((layout) => {
        layout = layout.filter((data) => data.id !== panelId);
      }),
    );
  };

  const useData: IPanelContext['useData'] = (panelId) =>
    createMemo(() => state.layout.find((item) => item.id === panelId));

  const getHandleId = () => lastRegisterPanelId;

  const createMouseDownHandler = useResize({
    zoom: () => props.zoom,
    scale: () => props.scale,
    direction: () => props.direction,
    state: () => state,
    containerRef,
    onLayoutChange,
  });

  return (
    <PanelContext.Provider
      value={{
        registerPanel,
        unregisterPanel,
        useData,
        createMouseDownHandler,
        getHandleId,
      }}
    >
      <Dynamic
        ref={setContainerRef}
        component={props.tag}
        style={{ 'flex-direction': props.direction }}
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
