import { batch, createSignal } from 'solid-js';
import type { Accessor } from 'solid-js';

export type CorrectionAccessors = {
  zoom: Accessor<number | undefined>;
  scale: Accessor<number | undefined>;
};

export const correctValue = (value: number, zoom = 1, scale = 1) => value / zoom / scale;

export const createMouseDelta = ({ zoom, scale }: CorrectionAccessors) => {
  // Assume that we don't change zoom and scale during mouse delta updates
  let initialClientX = 0;
  let initialClientY = 0;

  const [deltaX, setDeltaX] = createSignal(0);
  const [deltaY, setDeltaY] = createSignal(0);

  return {
    deltaX,
    deltaY,
    init: (e: MouseEvent) => {
      initialClientX = correctValue(e.clientX, zoom(), scale());
      initialClientY = correctValue(e.clientY, zoom(), scale());
    },
    updateMouseDelta: (e: MouseEvent) =>
      batch(() => {
        setDeltaX(correctValue(e.clientX, zoom(), scale()) - initialClientX);
        setDeltaY(correctValue(e.clientY, zoom(), scale()) - initialClientY);
      }),
  };
};
