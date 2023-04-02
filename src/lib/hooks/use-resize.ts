import { Accessor, createEffect, createSignal, on, onCleanup } from "solid-js";
import { TOTAL_FLEX_GROW } from "../constants";
import { SolidPanelStateAdapter } from "../store";
import type { Direction } from "../types";
import { roundTo4Digits } from "../utils/math";

import { CorrectionAccessors, createMouseDelta } from "../utils/mouse-delta";
import { useAvailableSpace } from "./use-available-space";

interface Params extends CorrectionAccessors {
  direction: Accessor<Direction>;
  state: Accessor<SolidPanelStateAdapter["state"]>;
  onSizeChange: SolidPanelStateAdapter["onLayoutChange"];
  container: Accessor<HTMLElement | undefined>;
  reverse: Accessor<boolean>;
}

export const useResize = ({
  zoom,
  scale,
  direction,
  onSizeChange,
  state,
  container,
  reverse,
}: Params) => {
  const mouseDelta = createMouseDelta({
    zoom,
    scale,
  });

  const [resizablePanelId, setResizablePanelId] = createSignal<
    string | undefined
  >(undefined);

  const createMouseDownHandler = (id: Accessor<string>) => (e: MouseEvent) => {
    mouseDelta.init(e);

    setResizablePanelId(id());
  };

  const containerSize = useAvailableSpace({ container, direction });

  createEffect(
    on(resizablePanelId, (panelId) => {
      if (!panelId) return;

      const flexGrowOnResizeStart: (number | undefined)[] = state().layout.map(
        (item) => item.size
      );

      const handleMouseMove = (e: MouseEvent) => mouseDelta.updateMouseDelta(e);

      const handleMouseUp = () => setResizablePanelId(undefined);

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp, { once: true });

      // There things are not reactive during resize
      const isHorizontal = direction() === "horizontal";
      const reverseSign = reverse() ? -1 : 1;

      const deltaPX = () =>
        (isHorizontal ? mouseDelta.deltaX() : mouseDelta.deltaY()) *
        reverseSign;

      createEffect(
        on(deltaPX, (currentDeltaPX) => {
          const containerElement = container();

          if (!containerElement) return;

          const deltaFlexGrow = roundTo4Digits(
            // TODO: change this logic in state setter
            (currentDeltaPX * TOTAL_FLEX_GROW) / roundTo4Digits(containerSize())
          );

          if (deltaFlexGrow !== 0)
            onSizeChange(deltaFlexGrow, panelId, flexGrowOnResizeStart);
        })
      );

      onCleanup(() => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      });
    })
  );

  return createMouseDownHandler;
};
