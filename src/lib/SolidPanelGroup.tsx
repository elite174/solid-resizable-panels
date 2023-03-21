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
import { makeLogText } from "./utils/log";

interface Props {
  config: {
    id: string;
    size: number;
    minSize?: number;
    maxSize?: number;
  }[];
  direction?: "vertical" | "horizontal";
  tag?: string;
  class?: string;
  reverse?: boolean;
}

export const SolidPanelGroup: ParentComponent<Props> = (initialProps) => {
  const props = mergeProps({ tag: "div" }, initialProps);

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
      <For each={props.config}>
        {(item, index) => {
          const child = () =>
            resolvedChildren().find(
              (element) =>
                element.getAttribute(SOLID_PANEL_ATTRIBUTE_NAME) === item.id
            );

          const isLast = () => index() === props.config.length - 1;

          return (
            <Show when={child()} keyed>
              {(content) => {
                return (
                  <>
                    <div>{content}</div>
                    <Show when={!isLast()}>
                      <button class="resize-handle"></button>
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
