import type { ParentComponent } from 'solid-js';
import { mergeProps, useContext } from 'solid-js';
import { Dynamic } from 'solid-js/web';

import { PanelContext } from './context';
import { makeLogText } from './utils/log';
import {
  CLASSNAMES,
  SOLID_PANEL_ID_ATTRIBUTE_NAME,
  SOLID_PANEL_HANDLE_ATTRIBUTE_NAME,
} from './constants';

interface ResizeHandleProps {
  tag?: string;
  class?: string;
}

export const ResizeHandle: ParentComponent<ResizeHandleProps> = (initialProps) => {
  const props = mergeProps({ tag: 'button' }, initialProps);
  const context = useContext(PanelContext);

  if (!context) {
    console.warn(
      makeLogText(`Error: Panel component must be rendered inside PanelGroup component`),
    );

    return null;
  }

  const handleMouseDown = (e: MouseEvent) => {
    const resizeHandleElement = e.currentTarget;

    const panelId =
      resizeHandleElement instanceof HTMLElement
        ? resizeHandleElement.previousElementSibling?.getAttribute(SOLID_PANEL_ID_ATTRIBUTE_NAME)
        : null;

    if (panelId) context.createMouseDownHandler(panelId)(e);
  };

  return (
    <Dynamic
      {...{ [SOLID_PANEL_HANDLE_ATTRIBUTE_NAME]: true }}
      component={props.tag}
      classList={{
        [CLASSNAMES.resizeHandle]: true,
        [props.class ?? '']: true,
      }}
      onMouseDown={handleMouseDown}
    >
      {props.children}
    </Dynamic>
  );
};
