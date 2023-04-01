import { createStore, produce, reconcile } from "solid-js/store";

import type { LayoutItem } from "../types";
import { clamp, EPSILON, isZero } from "../utils/math";

interface Params {
  layout: LayoutItem[];
}

const computeSpentFlexGrow = (newFlexGrow: number, initialFlexGrow: number) =>
  Math.abs(newFlexGrow - initialFlexGrow);

const generateNewState = (
  layout: LayoutItem[],
  flexGrowOnResizeStart: number[],
  resizableItemIndex: number,
  deltaSize: number
) => {
  const result: (number | undefined)[] = new Array(
    flexGrowOnResizeStart.length
  );
  const deltaSizeAbs = Math.abs(deltaSize);

  let remainingDeltaSizeLeftAbs = deltaSizeAbs;
  let revealedDeltaSizeLeft = 0;
  let spentDeltaSizeLeft = 0;

  const resizeDirection = Math.sign(deltaSize) > 0 ? "left" : "right";

  const tryToCollapseLeftSide = () => {
    // Now if we have some budget
    // we need to collapse items from the left side (if we're going to left)
    // We need to collapse them one by one:
    // If we don't have enough budget to collapse
    // stop iterate on items
    if (resizeDirection === "left" && remainingDeltaSizeLeftAbs > EPSILON) {
      for (let i = resizableItemIndex; i >= 0; i--) {
        if (flexGrowOnResizeStart[i] === 0) continue;

        const currentItem = layout[i];

        // If we can collapse an item
        // Do this
        if (currentItem.collapsible) {
          if (currentItem.minFlexGrow < remainingDeltaSizeLeftAbs) {
            result[i] = 0;

            remainingDeltaSizeLeftAbs -= currentItem.minFlexGrow;
            // Don't need to iterate further because we don't have enough budget to collapse nearest item
          } else break;
        }
      }
    }
  };

  const tryToCollapseRightSide = () => {
    // Now if we have some budget
    // we need to collapse items from the right side
    // We need to collapse them one by one:
    // If we don't have enough budget to collapse
    // stop iterate on items
    if (resizeDirection === "right" && remainingDeltaSizeRightAbs > EPSILON) {
      for (let i = resizableItemIndex + 1; i < layout.length; i++) {
        // We can't shrink this item even more
        if (flexGrowOnResizeStart[i] === 0) continue;

        const currentItem = layout[i];

        // If we can collapse an item
        // Do this
        if (currentItem.collapsible) {
          if (currentItem.minFlexGrow < remainingDeltaSizeRightAbs) {
            result[i] = 0;

            remainingDeltaSizeRightAbs -= currentItem.minFlexGrow;
            // Don't need to iterate further because we don't have enough budget to collapse nearest item
          } else break;
        }
      }
    }
  };

  // Below we try to resize all the items from the left side
  // and from the right side.
  // We cannot skip items or break the loop if we spent all resize budget
  // because of visual bugs (fast resize)

  // Firstly try to change the left side
  for (let i = resizableItemIndex; i >= 0; i--) {
    // We can't shrink this item even more
    if (flexGrowOnResizeStart[i] === 0 && resizeDirection === "left") continue;

    const virtualFlexGrow =
      flexGrowOnResizeStart[i] +
      remainingDeltaSizeLeftAbs * Math.sign(deltaSize);

    const revealed =
      layout[i].collapsible &&
      isZero(flexGrowOnResizeStart[i]) &&
      virtualFlexGrow > EPSILON;

    const newFlexGrow = clamp(
      virtualFlexGrow,
      layout[i].minFlexGrow ?? 0,
      layout[i].maxFlexGrow ?? Infinity
    );

    const deltaSpent = computeSpentFlexGrow(
      newFlexGrow,
      flexGrowOnResizeStart[i]
    );

    spentDeltaSizeLeft += deltaSpent;

    if (revealed) revealedDeltaSizeLeft += layout[i].minFlexGrow ?? 0;

    remainingDeltaSizeLeftAbs = remainingDeltaSizeLeftAbs - deltaSpent;

    result[i] = newFlexGrow;
  }

  tryToCollapseLeftSide();

  let remainingDeltaSizeRightAbs = deltaSizeAbs;
  let revealedDeltaSizeRight = 0;
  let spentDeltaSizeRight = 0;

  // Now try to change right side
  for (let i = resizableItemIndex + 1; i < layout.length; i++) {
    // We can't shrink this item even more
    if (flexGrowOnResizeStart[i] === 0 && Math.sign(deltaSize) > 0) continue;

    const virtualFlexGrow = // Minus here is because we're changing right side
      flexGrowOnResizeStart[i] -
      remainingDeltaSizeRightAbs * Math.sign(deltaSize);

    const revealed =
      layout[i].collapsible &&
      isZero(flexGrowOnResizeStart[i]) &&
      virtualFlexGrow > EPSILON;

    const newFlexGrow = clamp(
      virtualFlexGrow,
      layout[i].minFlexGrow ?? 0,
      layout[i].maxFlexGrow ?? Infinity
    );

    const deltaSpent = computeSpentFlexGrow(
      newFlexGrow,
      flexGrowOnResizeStart[i]
    );

    spentDeltaSizeRight += deltaSpent;

    if (revealed) revealedDeltaSizeRight += layout[i].minFlexGrow ?? 0;

    remainingDeltaSizeRightAbs -= deltaSpent;

    result[i] = newFlexGrow;
  }

  tryToCollapseRightSide();

  spentDeltaSizeLeft = clamp(
    spentDeltaSizeLeft - revealedDeltaSizeLeft,
    0,
    Infinity
  );
  spentDeltaSizeRight = clamp(
    spentDeltaSizeRight - revealedDeltaSizeRight,
    0,
    Infinity
  );

  // here we need to correct left side
  // because we can't resize it more than right side
  if (spentDeltaSizeLeft - spentDeltaSizeRight > EPSILON) {
    remainingDeltaSizeLeftAbs = spentDeltaSizeRight;

    for (let i = resizableItemIndex; i >= 0; i--) {
      // We can't shrink this item even more
      if (flexGrowOnResizeStart[i] === 0 && Math.sign(deltaSize) < 0) continue;

      const virtualFlexGrow =
        flexGrowOnResizeStart[i] +
        remainingDeltaSizeLeftAbs * Math.sign(deltaSize);
      // we could get further on the first try
      // so if we don't have budget to resize
      // we need to clean up further items
      // We need to revisit all the items
      // to get rid of stale visual artifacts (for example, when a user resizes panel really fast)
      const newFlexGrow = clamp(
        virtualFlexGrow,
        layout[i].minFlexGrow ?? 0,
        layout[i].maxFlexGrow ?? Infinity
      );

      remainingDeltaSizeLeftAbs -= computeSpentFlexGrow(
        newFlexGrow,
        flexGrowOnResizeStart[i]
      );

      result[i] = newFlexGrow;
    }

    tryToCollapseLeftSide();

    // but here we need to correct right side
  } else if (spentDeltaSizeRight - spentDeltaSizeLeft > EPSILON) {
    remainingDeltaSizeRightAbs = spentDeltaSizeLeft;

    for (let i = resizableItemIndex + 1; i < layout.length; i++) {
      // We can't shrink this item even more
      if (flexGrowOnResizeStart[i] === 0 && resizeDirection === "right")
        continue;

      const virtualFlexGrow =
        flexGrowOnResizeStart[i] -
        remainingDeltaSizeRightAbs * Math.sign(deltaSize);
      // we could get further on the first try
      // so if we don't have budget to resize
      // we need to clean up further items
      // We need to revisit all the items
      // to get rid of stale visual artifacts (for example, when a user resizes panel really fast)

      const newFlexGrow = clamp(
        // Minus here is because we're changing right side
        virtualFlexGrow,
        layout[i].minFlexGrow ?? 0,
        layout[i].maxFlexGrow ?? Infinity
      );

      remainingDeltaSizeRightAbs -= computeSpentFlexGrow(
        newFlexGrow,
        flexGrowOnResizeStart[i]
      );

      result[i] = newFlexGrow;
    }

    tryToCollapseRightSide();
  }

  return result;
};

export const createPanelStore = ({ layout: config }: Params) => {
  const [state, setState] = createStore({ config }, { name: "PanelStore" });

  const setConfig = (config: LayoutItem[]) =>
    setState("config", reconcile(config));

  const onLayoutChange = (
    deltaSize: number,
    // TODO pass panelIndex here?
    panelId: string,
    flexGrowOnResizeStart: number[]
  ) => {
    const resizableItemIndex = state.config.findIndex(
      (item) => item.id === panelId
    );

    // TODO handle error somehow
    if (resizableItemIndex === -1) return;

    const newState = generateNewState(
      state.config,
      flexGrowOnResizeStart,
      resizableItemIndex,
      deltaSize
    );

    setState(
      produce((s) => {
        for (let i = 0; i < newState.length; i++) {
          // hate TS for this
          if (newState[i] !== undefined) s.config[i].flexGrow = newState[i]!;
        }
      })
    );
  };

  return {
    state,
    setConfig,
    onLayoutChange,
  };
};

export type SolidPanelStateAdapter = ReturnType<typeof createPanelStore>;
