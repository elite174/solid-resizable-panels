import type { ParentComponent } from 'solid-js';
import { mergeProps, useContext } from 'solid-js';
import { Dynamic } from 'solid-js/web';

import { PanelContext } from './PanelGroup';
import { makeLogText } from './utils/log';
import {
  CLASSNAMES,
  SOLID_PANEL_ID_ATTRIBUTE_NAME,
  SOLID_PANEL_HANDLE_ATTRIBUTE_NAME,
} from './constants';

export interface ResizeHandleProps {
  /**
   * Disables the handle
   * @default false
   */
  disabled?: boolean;
  /**
   * Rendered HTML tag
   * @default "button"
   */
  tag?: string;
  /**
   * Extra class passed to panel DOM element.
   */
  class?: string;
}

export const ResizeHandle: ParentComponent<ResizeHandleProps> = (initialProps) => {
  const props = mergeProps({ tag: 'button', disabled: false }, initialProps);

  const context = useContext(PanelContext);
  if (!context)
    throw new Error(makeLogText(`Panel component must be rendered inside PanelGroup component`));

  return (
    <Dynamic
      {...{ [SOLID_PANEL_HANDLE_ATTRIBUTE_NAME]: true }}
      component={props.tag}
      disabled={props.disabled}
      classList={{
        [CLASSNAMES.resizeHandle]: true,
        [CLASSNAMES.resizeHandleDisabled]: props.disabled,
        [props.class ?? '']: true,
      }}
      onMouseDown={(e: MouseEvent) => {
        if (props.disabled) return;

        const resizeHandleElement = e.currentTarget;

        // find resizable panel dynamically
        const panelId =
          resizeHandleElement instanceof HTMLElement
            ? resizeHandleElement.previousElementSibling?.getAttribute(
                SOLID_PANEL_ID_ATTRIBUTE_NAME,
              )
            : null;

        // check that we have panels from both sides
        const nextPanelId =
          resizeHandleElement instanceof HTMLElement
            ? resizeHandleElement.nextElementSibling?.getAttribute(SOLID_PANEL_ID_ATTRIBUTE_NAME)
            : null;

        if (panelId && nextPanelId) context.onPanelResize(panelId, e);
      }}
    >
      {props.children}
    </Dynamic>
  );
};
