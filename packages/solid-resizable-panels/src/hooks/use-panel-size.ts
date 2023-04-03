import { Accessor, createEffect, on } from "solid-js";

import { SOLID_PANEL_ATTRIBUTE_NAME } from "../constants";
import { Direction } from "../types";

const computeTotalPanelSizePX = (
  containerElement: HTMLElement,
  direction: Direction
) => {
  let totalSizePX = 0;

  const property = direction === "horizontal" ? "width" : "height";

  for (const item of containerElement.children) {
    if (item.getAttribute(SOLID_PANEL_ATTRIBUTE_NAME))
      totalSizePX += item.getBoundingClientRect()[property];
  }

  return totalSizePX;
};

export const useTotalPanelSizePX = (
  container: Accessor<HTMLElement | undefined>,
  panelCount: Accessor<number>,
  direction: Accessor<Direction>
) => {
  let totalPanelSizePX = 0;

  createEffect(
    on(
      // we also need to track panel count to invalidate size
      [container, direction, panelCount],
      ([containerElement, currentDirection]) => {
        if (containerElement) {
          totalPanelSizePX = computeTotalPanelSizePX(
            containerElement,
            // direction here will cause an effect rerun
            currentDirection
          );
        }
      }
    )
  );

  return () => totalPanelSizePX;
};
