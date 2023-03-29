import {
  Accessor,
  createEffect,
  createSignal,
  onCleanup,
  untrack,
} from "solid-js";
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
}

export const useResize = ({
  zoom,
  scale,
  direction,
  onSizeChange,
  state,
  container,
}: Params) => {
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

  const containerSize = useAvailableSpace({ container, direction });

  createEffect(() => {
    const itemId = beforeItemId();

    if (itemId) {
      const handleMouseMove = (e: MouseEvent) => mouseDelta.computeDelta(e);

      const stateBeforeResize = untrack(() =>
        state().config.map((item) => ({ id: item.id, flexGrow: item.flexGrow }))
      );

      const totalFlexGrow = untrack(() =>
        roundTo4Digits(
          state().config.reduce((sum, item) => sum + item.flexGrow, 0)
        )
      );

      const handleMouseUp = () => {
        resizeElement = null;

        setBeforeItemId(undefined);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp, { once: true });

      createEffect(() => {
        const containerElement = container();

        if (!containerElement) return;

        const isHorizontal = () => direction() === "horizontal";
        const deltaPX = () =>
          isHorizontal() ? mouseDelta.deltaX() : mouseDelta.deltaY();

        const computeDeltaFlexGrow = (deltaPX: number) =>
          untrack(() => {
            //console.log(deltaPX, totalFlexGrow, containerSize());

            console.log(deltaPX);
            return roundTo4Digits(
              // Assume here, that the sum is always the same.
              // TODO: change this logic in state setter
              (deltaPX * totalFlexGrow) / roundTo4Digits(containerSize())
            );
          });

        const deltaGrow = computeDeltaFlexGrow(deltaPX());

        if (deltaGrow !== 0)
          untrack(() => onSizeChange(deltaGrow, itemId, stateBeforeResize));
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
