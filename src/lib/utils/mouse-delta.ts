import { batch, createComputed, createSignal } from "solid-js";
import type { Accessor } from "solid-js";

export type CorrectionAccessors = {
  zoom: Accessor<number>;
  scale: Accessor<number>;
};

export const correctValue = (value: number, zoom: number, scale: number) =>
  value / zoom / scale;

export const createMouseDelta = ({ zoom, scale }: CorrectionAccessors) => {
  const [deltaX, setDeltaX] = createSignal(0);
  const [deltaY, setDeltaY] = createSignal(0);
  const [initialClientX, setInitialClientX] = createSignal(0);
  const [initialClientY, setInitialClientY] = createSignal(0);

  createComputed<[number, number]>(
    ([prevZoom, prevScale]) => {
      batch(() => {
        setInitialClientX((x) =>
          correctValue(x * prevZoom * prevScale, zoom(), scale())
        );
        setInitialClientY((y) =>
          correctValue(y * prevZoom * prevScale, zoom(), scale())
        );
      });

      return [zoom(), scale()];
    },
    [zoom(), scale()],
    { name: "Computation: update initial coordinates according to zoom" }
  );

  return {
    deltaX,
    deltaY,
    init: (e: MouseEvent) => {
      batch(() => {
        setInitialClientX(correctValue(e.clientX, zoom(), scale()));
        setInitialClientY(correctValue(e.clientY, zoom(), scale()));
        setDeltaX(0);
        setDeltaY(0);
      });
    },
    updateMouseDelta: (e: MouseEvent) => {
      batch(() => {
        setDeltaX(correctValue(e.clientX, zoom(), scale()) - initialClientX());
        setDeltaY(correctValue(e.clientY, zoom(), scale()) - initialClientY());
      });
    },
  };
};
