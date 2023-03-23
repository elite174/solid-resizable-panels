import { Accessor, createEffect, createSignal, onCleanup } from "solid-js";
import { SOLID_PANEL_ATTRIBUTE_NAME } from "../constants";
import { SolidPanelStateAdapter } from "../store";
import type { Direction } from "../types";

import { CorrectionAccessors, createMouseDelta } from "../utils/mouse-delta";

interface Params extends CorrectionAccessors {
  direction: Accessor<Direction>;
  onSizeChange: SolidPanelStateAdapter["onSizeChange"];
}

export const useResize = ({ zoom, scale, direction, onSizeChange }: Params) => {
  const mouseDelta = createMouseDelta({
    zoom,
    scale,
  });

  const [beforeItemId, setBeforeItemId] = createSignal<string | undefined>(
    undefined
  );

  let resizeElement: HTMLElement | null = null;

  const createMouseDownHandler = (id: string) => (e: MouseEvent) => {
    resizeElement = e.currentTarget as HTMLElement | null;

    mouseDelta.init(e);

    setBeforeItemId(id);
  };

  createEffect(() => {
    const resizeStarted = beforeItemId();
    if (resizeStarted) {
      const handleMouseMove = (e: MouseEvent) => mouseDelta.computeDelta(e);

      const handleMouseUp = () => {
        resizeElement = null;

        setBeforeItemId(undefined);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp, { once: true });

      createEffect(() => {
        const isHorizontal = () => direction() === "horizontal";
        const deltaSize = () =>
          isHorizontal() ? mouseDelta.deltaX() : mouseDelta.deltaY();

        onSizeChange(deltaSize(), resizeStarted);
      });

      onCleanup(() => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      });
    }
  });

  return {
    createMouseDownHandler,
  };
};
