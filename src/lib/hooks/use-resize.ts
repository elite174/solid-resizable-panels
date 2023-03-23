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

interface Params extends CorrectionAccessors {
  direction: Accessor<Direction>;
  state: Accessor<SolidPanelStateAdapter["state"]>;
  onSizeChange: SolidPanelStateAdapter["onLayoutChange"];
  containerSize: Accessor<number>;
  container: Accessor<HTMLElement | undefined>;
}

export const useResize = ({
  zoom,
  scale,
  direction,
  onSizeChange,
  state,
  containerSize,
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

  createEffect(() => {
    const itemId = beforeItemId();

    if (itemId) {
      const handleMouseMove = (e: MouseEvent) => mouseDelta.computeDelta(e);

      const stateBeforeResize = untrack(() =>
        state().config.map((item) => ({ id: item.id, flexGrow: item.flexGrow }))
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
            const flexGrowSum = roundTo4Digits(
              state().config.reduce((sum, item) => item.flexGrow + sum, 0)
            );

            return roundTo4Digits(
              (deltaPX * flexGrowSum) / roundTo4Digits(containerSize())
            );
          });

        const deltaGrow = computeDeltaFlexGrow(deltaPX());

        onSizeChange(deltaGrow, itemId, stateBeforeResize);
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
