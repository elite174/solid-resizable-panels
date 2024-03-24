import type { Accessor } from "solid-js";
import { createMemo, on } from "solid-js";

import { SOLID_PANEL_ID_ATTRIBUTE_NAME } from "../constants";
import { isHorizontalDirection } from "../utils/direction";

import type { Direction } from "../types";

const computeTotalPanelSizePX = (containerElement: HTMLElement, domRectProperty: "width" | "height") => {
  let totalSizePX = 0;

  for (const item of containerElement.children) {
    if (item.getAttribute(SOLID_PANEL_ID_ATTRIBUTE_NAME)) totalSizePX += item.getBoundingClientRect()[domRectProperty];
  }

  return totalSizePX;
};

/**
 * Returns an accessor with cumulative panels width in px
 */
export const createTotalPanelSizePX = (
  container: Accessor<HTMLElement | undefined>,
  panelCount: Accessor<number>,
  direction: Accessor<Direction>
) => {
  const domRectProperty = createMemo(() => (isHorizontalDirection(direction()) ? "width" : "height"));

  return createMemo(
    on(
      // we also need to track panel count to invalidate size
      [container, domRectProperty, panelCount],
      ([containerElement, currentDOMRectProperty]) => {
        let totalPanelSizePX = 0;

        if (containerElement) {
          totalPanelSizePX = computeTotalPanelSizePX(
            containerElement,
            // changing direction here will cause an effect rerun
            currentDOMRectProperty
          );
        }

        return totalPanelSizePX;
      }
    )
  );
};
