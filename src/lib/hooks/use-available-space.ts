import { Accessor, createMemo, onCleanup, onMount } from "solid-js";
import { SOLID_PANEL_HANDLE_ATTRIBUTE_NAME } from "../constants";
import { Direction } from "../types";

interface Params {
  container: Accessor<HTMLElement | undefined>;
  direction: Accessor<Direction>;
}

export const useAvailableSpace = ({ container, direction }: Params) => {
  let availableSpace = 0;

  const domSizeProperty = createMemo(() =>
    direction() === "horizontal" ? ("Width" as const) : ("Height" as const)
  );

  const computeAvailableSpace = (containerElement: HTMLElement) => {
    let result = 0;

    for (let i = 0; i < containerElement.children.length; i++) {
      const child = containerElement.children.item(i);

      if (child && !child.hasAttribute(SOLID_PANEL_HANDLE_ATTRIBUTE_NAME))
        result += child[`client${domSizeProperty()}`];
    }

    return result;
  };

  const updateAvailableSpace = (newSpace: number) => {
    availableSpace = newSpace;
  };

  onMount(() => {
    const containerElement = container();

    if (!containerElement) return;

    const resizeObserver = new ResizeObserver(([containerEntry]) =>
      updateAvailableSpace(
        computeAvailableSpace(containerEntry.target as HTMLElement)
      )
    );
    const mutationObserver = new MutationObserver((mutationList) => {
      for (const mutation of mutationList) {
        if (
          mutation.type === "childList" &&
          mutation.target === containerElement
        ) {
          updateAvailableSpace(computeAvailableSpace(containerElement));
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

    onCleanup(() => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    });
  });

  return () => availableSpace;
};
