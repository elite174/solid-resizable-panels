import { Accessor, createMemo, onCleanup, onMount } from "solid-js";

import { SOLID_PANEL_HANDLE_ATTRIBUTE_NAME } from "../constants";
import { Direction } from "../types";

interface Params {
  container: Accessor<HTMLElement | undefined>;
  direction: Accessor<Direction>;
}

export const useAvailableSpace = ({ container, direction }: Params) => {
  let containerSize = 0;
  let cumulativeResizeHandleSize = 0;

  const contentRectProperty = createMemo(() =>
    direction() === "horizontal" ? ("width" as const) : ("height" as const)
  );

  const computeCumulativeResizeHandleSize = (containerElement: HTMLElement) => {
    let result = 0;

    const resizeHandles = containerElement.querySelectorAll(
      `[${SOLID_PANEL_HANDLE_ATTRIBUTE_NAME}]`
    );

    for (let i = 0; i < resizeHandles.length; i++) {
      // optimize this!!!
      result += resizeHandles[i].getBoundingClientRect()[contentRectProperty()];
    }

    return result;
  };

  onMount(() => {
    const containerElement = container();

    if (!containerElement) return;

    const updateResizeHandleSize = (newSize: number) => {
      cumulativeResizeHandleSize = newSize;
    };

    const resizeObserver = new ResizeObserver(
      ([containerEntry]) =>
        (containerSize = containerEntry.contentRect[contentRectProperty()])
    );

    const mutationObserver = new MutationObserver((mutationList) => {
      for (const mutation of mutationList) {
        if (
          mutation.type === "childList" &&
          mutation.target === containerElement
        ) {
          updateResizeHandleSize(
            computeCumulativeResizeHandleSize(containerElement)
          );
          break;
        }
      }
    });

    mutationObserver.observe(containerElement, {
      attributes: false,
      subtree: false,
      childList: true,
    });

    resizeObserver.observe(containerElement);

    updateResizeHandleSize(computeCumulativeResizeHandleSize(containerElement));

    onCleanup(() => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    });
  });

  return () => containerSize - cumulativeResizeHandleSize;
};
