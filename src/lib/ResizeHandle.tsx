import { ParentComponent, mergeProps, onMount, useContext } from "solid-js";

import { PanelContext } from "./context";
import { makeLogText } from "./utils/log";
import { SOLID_PANEL_HANDLE_ATTRIBUTE_NAME } from "./constants";
import { Dynamic } from "solid-js/web";

interface ResizeHandleProps {
  tag?: string;
  class?: string;
}

export const ResizeHandle: ParentComponent<ResizeHandleProps> = (
  initialProps
) => {
  const props = mergeProps({ tag: "button" }, initialProps);
  const context = useContext(PanelContext);

  if (!context) {
    console.warn(
      makeLogText(
        `Error: Panel component must be rendered inside PanelGroup component`
      )
    );

    return null;
  }

  let panelId = "";

  // ResizeHandle should be mounter right after Panel
  onMount(() => {
    panelId = context.getHandleId();
  });

  const handleMouseDown = context.createMouseDownHandler(() => panelId);

  return (
    <Dynamic
      {...{ [SOLID_PANEL_HANDLE_ATTRIBUTE_NAME]: true }}
      component={props.tag}
      classList={{ "resize-handle": true, [props.class ?? ""]: true }}
      onMouseDown={handleMouseDown}
    >
      {props.children}
    </Dynamic>
  );
};
