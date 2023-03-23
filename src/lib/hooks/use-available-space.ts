import {
  Accessor,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
} from "solid-js";
import { SOLID_PANEL_HANDLE_ATTRIBUTE_NAME } from "../constants";
import { Direction } from "../types";

interface Params {
  container: Accessor<HTMLElement | undefined>;
  direction: Accessor<Direction>;
}

export const useAvailableSpace = ({ container, direction }: Params) => {
  const [containerSize, setContainerSize] = createSignal(0);
  const [totalResizeHandleSize, setTotalResizeHandleSize] = createSignal(0);

  const domSizeProperty = createMemo(() =>
    direction() === "horizontal" ? "width" : ("height" as const)
  );

  onMount(() => {
    const containerElement = container();

    if (!containerElement) return;

    const resizeObserver = new ResizeObserver(([containerEntry]) => {
      setContainerSize(
        direction() === "horizontal"
          ? containerEntry.contentRect.width
          : containerEntry.contentRect.height
      );
    });

    const res = new ResizeObserver((entries) => {
      setTotalResizeHandleSize(
        entries.reduce(
          (sum, item) => sum + item.contentRect[domSizeProperty()],
          0
        )
      );
    });

    resizeObserver.observe(containerElement);

    containerElement
      .querySelectorAll(`[${SOLID_PANEL_HANDLE_ATTRIBUTE_NAME}]`)
      .forEach((element) => res.observe(element));

    onCleanup(() => {
      resizeObserver.disconnect();
      res.disconnect();
    });
  });

  return () => containerSize() - totalResizeHandleSize();
};
