import { Accessor, createEffect, createSignal, on, onCleanup } from "solid-js";
import { TOTAL_FLEX_GROW } from "../constants";
import { SolidPanelStateAdapter } from "../store";
import type { Direction } from "../types";
import { roundTo4Digits } from "../utils/math";

import { CorrectionAccessors, createMouseDelta } from "../utils/mouse-delta";
import { useTotalPanelSizePX } from "./use-panel-size";

interface Params extends CorrectionAccessors {
  direction: Accessor<Direction>;
  state: Accessor<SolidPanelStateAdapter["state"]>;
  onSizeChange: SolidPanelStateAdapter["onLayoutChange"];
  reverse: Accessor<boolean>;
  containerRef: Accessor<HTMLElement | undefined>;
}

export const useResize = ({
  zoom,
  scale,
  direction,
  onSizeChange,
  state,
  reverse,
  containerRef,
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

  createEffect(
    on(resizablePanelId, (panelId) => {
      if (!panelId) return;

      const totalPanelSizePX = useTotalPanelSizePX(
        containerRef,
        () => state().layout.length,
        direction
      );

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
          const deltaFlexGrow = roundTo4Digits(
            (currentDeltaPX * TOTAL_FLEX_GROW) / totalPanelSizePX()
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
