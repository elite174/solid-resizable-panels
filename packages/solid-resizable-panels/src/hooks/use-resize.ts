import { Accessor } from 'solid-js';
import { createEffect, createSignal, on, onCleanup } from 'solid-js';

import { TOTAL_FLEX_GROW } from '../constants';
import { CreatePanelStore } from '../store';
import { useTotalPanelSizePX } from './use-panel-size';
import { CorrectionAccessors, createMouseDelta } from '../utils/mouse-delta';
import { isHorizontalDirection, isReverseDirection } from '../utils/direction';

import type { Direction } from '../types';

interface Params extends CorrectionAccessors {
  direction: Accessor<Direction>;
  state: Accessor<CreatePanelStore['state']>;
  onLayoutChange: CreatePanelStore['onLayoutChange'];
  containerRef: Accessor<HTMLElement | undefined>;
}

export const useResize = ({
  zoom,
  scale,
  direction,
  onLayoutChange,
  state,
  containerRef,
}: Params) => {
  const mouseDelta = createMouseDelta({
    zoom,
    scale,
  });

  const [resizablePanelId, setResizablePanelId] = createSignal<string | undefined>(undefined);

  const createMouseDownHandler = (id: string) => (e: MouseEvent) => {
    mouseDelta.init(e);

    setResizablePanelId(id);
  };

  createEffect(
    on(resizablePanelId, (panelId) => {
      if (!panelId) return;

      const totalPanelSizePX = useTotalPanelSizePX(
        containerRef,
        () => state().layout.length,
        direction,
      );

      const flexGrowOnResizeStart: number[] = state().layout.map((item) => item.size);

      const handleMouseMove = (e: MouseEvent) => mouseDelta.updateMouseDelta(e);

      const handleMouseUp = () => setResizablePanelId(undefined);

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp, { once: true });

      // There things are not reactive during resize
      const isHorizontal = isHorizontalDirection(direction());
      const reverseSign = isReverseDirection(direction()) ? -1 : 1;

      const deltaPX = () =>
        (isHorizontal ? mouseDelta.deltaX() : mouseDelta.deltaY()) * reverseSign;

      createEffect(
        on(deltaPX, (currentDeltaPX) => {
          const deltaFlexGrow = (currentDeltaPX * TOTAL_FLEX_GROW) / totalPanelSizePX();

          if (deltaFlexGrow !== 0) onLayoutChange(deltaFlexGrow, panelId, flexGrowOnResizeStart);
        }),
      );

      onCleanup(() => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      });
    }),
  );

  return createMouseDownHandler;
};

export type MouseDownHandlerCreator = ReturnType<typeof useResize>;
