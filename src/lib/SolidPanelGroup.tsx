import {
  mergeProps,
  ParentComponent,
  children,
  For,
  createMemo,
  Show,
} from "solid-js";
import { Dynamic } from "solid-js/web";
import { SOLID_PANEL_ATTRIBUTE_NAME } from "./constants";

import { useResize } from "./hooks/use-resize";
import { SolidPanelStateAdapter } from "./store";
import { Direction } from "./types";

import { makeLogText } from "./utils/log";

interface Props extends SolidPanelStateAdapter {
  direction?: Direction;
  tag?: string;
  class?: string;
  reverse?: boolean;
  zoom?: number;
  scale?: number;
}

export const SolidPanelGroup: ParentComponent<Props> = (initialProps) => {
  const props = mergeProps(
    { tag: "div", zoom: 1, scale: 1, direction: "horizontal" as Direction },
    initialProps
  );

  const resolvedChildren = createMemo<Element[]>(() => {
    const resolvedChildrenArray = children(() => props.children).toArray();

    const validChildren = [];

    for (let i = 0; i < resolvedChildrenArray.length; i++) {
      const currentChild = resolvedChildrenArray[i];
      if (
        currentChild instanceof Element &&
        currentChild.hasAttribute(SOLID_PANEL_ATTRIBUTE_NAME)
      )
        validChildren.push(currentChild);
      else
        console.warn(
          makeLogText(
            `The child ${currentChild} is not a valid child element. It should be an HTMLElement and should have data-grid-id attribute.`
          )
        );
    }

    return validChildren;
  });

  const { createMouseDownHandler } = useResize({
    zoom: () => props.zoom,
    scale: () => props.scale,
    direction: () => props.direction,
    onSizeChange: props.onSizeChange,
  });

  return (
    <Dynamic
      component={props.tag}
      classList={{
        ["solid-panel"]: true,
        ["solid-panel_vertical"]: props.direction === "vertical",
        ["solid-panel_reverse"]: Boolean(props.reverse),
        [props.class ?? ""]: true,
      }}
      style={{}}
    >
      <For each={props.state.config}>
        {(item, index) => {
          const child = () =>
            resolvedChildren().find(
              (element) =>
                element.getAttribute(SOLID_PANEL_ATTRIBUTE_NAME) === item.id
            );

          const isLast = () => index() === props.state.config.length - 1;

          return (
            <Show when={child()} keyed>
              {(content) => {
                return (
                  <>
                    <div style={{ "flex-grow": item.size }}>{content}</div>
                    <Show when={!isLast()}>
                      <button
                        data-solid-panel-resize-handle
                        class="resize-handle"
                        onMouseDown={createMouseDownHandler(item.id)}
                      ></button>
                    </Show>
                  </>
                );
              }}
            </Show>
          );
        }}
      </For>
    </Dynamic>
  );
};
