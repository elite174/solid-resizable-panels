import {
  mergeProps,
  ParentComponent,
  children,
  For,
  createMemo,
  Show,
  createSignal,
} from "solid-js";
import { Dynamic } from "solid-js/web";
import { SOLID_PANEL_ATTRIBUTE_NAME } from "./constants";

import { useResize } from "./hooks/use-resize";
import { SolidPanelStateAdapter } from "./store";
import { Direction } from "./types";

import { makeLogText } from "./utils/log";

interface Props {
  direction?: Direction;
  tag?: string;
  class?: string;
  reverse?: boolean;
  zoom?: number;
  scale?: number;
  state: SolidPanelStateAdapter["state"];
  onLayoutChange: SolidPanelStateAdapter["onLayoutChange"];
  onCollapse?: (panelId: string) => void;
  onReveal?: (panelId: string) => void;
}

export const SolidPanelGroup: ParentComponent<Props> = (initialProps) => {
  const props = mergeProps(
    {
      tag: "div",
      zoom: 1,
      scale: 1,
      direction: "horizontal" as Direction,
      reverse: false,
    },
    initialProps
  );

  const [container, setContainer] = createSignal<HTMLElement | undefined>(
    undefined
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
    onSizeChange: props.onLayoutChange,
    state: () => props.state,
    container,
    reverse: () => props.reverse,
  });

  return (
    <Dynamic
      style={{ height: "100vh" }}
      component={props.tag}
      ref={setContainer}
      classList={{
        ["solid-panel"]: true,
        ["solid-panel_vertical"]: props.direction === "vertical",
        ["solid-panel_reverse"]: Boolean(props.reverse),
        [props.class ?? ""]: true,
      }}
    >
      <For each={props.state.config}>
        {(item, index) => {
          const child = () =>
            resolvedChildren().find(
              (element) =>
                element.getAttribute(SOLID_PANEL_ATTRIBUTE_NAME) === item.id
            );

          return (
            <Show when={child()} keyed>
              {(content) => {
                const isLast = () => index() === props.state.config.length - 1;

                return (
                  <>
                    <div
                      style={{
                        "flex-grow": item.flexGrow,
                        "flex-shrink": 1,
                        "flex-basis": 0,
                        overflow: "hidden",
                      }}
                      data-solid-panel
                    >
                      {content}
                    </div>
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
