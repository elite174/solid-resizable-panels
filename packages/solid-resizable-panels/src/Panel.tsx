import type { ParentComponent } from 'solid-js';
import { createEffect, on, onCleanup, onMount, useContext } from 'solid-js';

import { PanelContext } from './context';
import { makeLogText } from './utils/log';
import { CLASSNAMES, SOLID_PANEL_ID_ATTRIBUTE_NAME } from './constants';

interface PanelProps {
  id: string;
  index?: number;
  size?: number;
  minSize?: number;
  maxSize?: number;
  collapsible?: boolean;
  class?: string;
  onCollapse?: () => void;
  onExpand?: () => void;
}

export const Panel: ParentComponent<PanelProps> = (props) => {
  const context = useContext(PanelContext);

  if (!context) {
    console.warn(
      makeLogText(`Error: Panel component must be rendered inside PanelGroup component`),
    );

    return null;
  }

  const { registerPanel, unregisterPanel, useData } = context;

  onMount(() => {
    const panelId = props.id;

    registerPanel(
      {
        id: props.id,
        size: props.size,
        minSize: props.minSize,
        maxSize: props.maxSize,
        collapsible: props.collapsible,
      },
      props.index,
    );

    onCleanup(() => unregisterPanel(panelId));
  });

  const data = useData(props.id);

  createEffect(
    on(data, (currentData) => {
      if (!currentData) return;

      createEffect(
        on(
          () => props.collapsible,
          (isCollapsible) => {
            if (isCollapsible) {
              createEffect(
                on(
                  () => currentData.size,
                  (size, prevSize) => {
                    if (size === 0 && prevSize !== 0) props.onCollapse?.();

                    return size;
                  },
                  { defer: true },
                ),
                currentData.size,
              );

              createEffect(
                on(
                  () => currentData.size,
                  (size, prevSize) => {
                    if (size !== 0 && prevSize === 0) props.onExpand?.();

                    return size;
                  },
                  { defer: true },
                ),
                currentData.size,
              );
            }
          },
        ),
      );
    }),
  );

  const flexGrow = () => data()?.size ?? 0;

  return (
    <div
      {...{ [SOLID_PANEL_ID_ATTRIBUTE_NAME]: props.id }}
      classList={{ [CLASSNAMES.panel]: true, [props.class ?? '']: true }}
      style={{
        'flex-grow': flexGrow(),
        'flex-shrink': 1,
        'flex-basis': '0px',
        overflow: 'hidden',
      }}
    >
      {props.children}
    </div>
  );
};
