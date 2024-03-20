import type { ParentComponent } from 'solid-js';
import { createComputed, mergeProps, on, onCleanup, onMount, untrack, useContext } from 'solid-js';
import { Dynamic } from 'solid-js/web';

import { CLASSNAMES, SOLID_PANEL_ID_ATTRIBUTE_NAME } from './constants';
import { PanelContext } from './PanelGroup';
import { makeLogText } from './utils/log';

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
  /** A callback called when size changes */
  onResize?: (newSize: number) => void;
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

  console.log(context);

  if (!context)
    throw new Error(makeLogText(`Panel component must be rendered inside PanelGroup component`));

  const { registerPanel, unregisterPanel, useData } = context;

  const data = useData(props.id);

  const size = () => data()?.size;

  createComputed(
    on(
      size,
      (currentSize) => {
        if (currentSize !== undefined) props.onResize?.(currentSize);
      },
      { defer: true },
    ),
  );

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
  createComputed(() => {
    if (!props.collapsible) return;

    createComputed(
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
      untrack(size),
    );
  });

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
