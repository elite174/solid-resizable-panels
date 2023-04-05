import { ParentComponent, mergeProps } from 'solid-js';
import { createEffect, on, onCleanup, onMount, useContext } from 'solid-js';
import { Dynamic } from 'solid-js/web';

import { PanelContext } from './context';
import { makeLogText } from './utils/log';
import { CLASSNAMES, SOLID_PANEL_ID_ATTRIBUTE_NAME } from './constants';

export interface PanelProps {
  id: string;
  /**
   * Index of the panel within panel group.
   * Should be passed when conditional panels used.
   * @default undefined
   */
  index?: number;
  /**
   * Rendered HTML tag
   * @default "div"
   */
  tag?: string;
  /**
   * Initial size of the panel in percent.
   * @default computed according to layout
   */
  initialSize?: number;
  /**
   * Minimum size of the panel in percent.
   * @default 0
   */
  minSize?: number;
  /**
   * Maximum size of the panel in percent.
   * @default 100
   */
  maxSize?: number;
  /**
   * Is panel collapsible
   * @default false
   */
  collapsible?: boolean;
  /**
   * Extra class passed to panel DOM element.
   */
  class?: string;
  /** A callback called when the panel becomes collapsed */
  onCollapse?: VoidFunction;
  /** A callback called when the panel becomes expanded */
  onExpand?: VoidFunction;
}

export const Panel: ParentComponent<PanelProps> = (initialProps) => {
  const props = mergeProps(
    {
      tag: 'div',
      minSize: 0,
      maxSize: 100,
      collapsible: false,
    },
    initialProps,
  );

  const context = useContext(PanelContext);

  if (!context) {
    console.warn(
      makeLogText(`Error: Panel component must be rendered inside PanelGroup component`),
    );

    return null;
  }

  const { registerPanel, unregisterPanel, useData } = context;

  const data = useData(props.id);

  const size = () => data()?.size;

  onMount(() => {
    const panelId = props.id;

    registerPanel(
      {
        id: panelId,
        size: props.initialSize,
        minSize: props.minSize,
        maxSize: props.maxSize,
        collapsible: props.collapsible,
      },
      props.index,
    );

    onCleanup(() => unregisterPanel(panelId));
  });

  // Effect for calling onExpand and onCollapse callbacks
  createEffect(
    on(
      () => props.collapsible,
      (isCollapsible) => {
        if (!isCollapsible) return;

        createEffect(
          on(
            size,
            (currentSize, previousSize) => {
              if (currentSize === undefined || previousSize === undefined) return;

              if (currentSize === 0 && previousSize !== 0) props.onCollapse?.();

              if (currentSize !== 0 && previousSize === 0) props.onExpand?.();

              return currentSize;
            },
            { defer: true },
          ),
          size(),
        );
      },
    ),
  );

  // Actually we may not render this until the data is computed,
  // however it would be not SSR friendly
  return (
    <Dynamic
      {...{ [SOLID_PANEL_ID_ATTRIBUTE_NAME]: props.id }}
      component={props.tag}
      classList={{ [CLASSNAMES.panel]: true, [props.class ?? '']: true }}
      style={{
        'flex-grow': size(),
        'flex-shrink': 1,
        'flex-basis': '0px',
        overflow: 'hidden',
      }}
    >
      {props.children}
    </Dynamic>
  );
};
