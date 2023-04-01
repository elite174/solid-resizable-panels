import { createStore, produce, reconcile } from "solid-js/store";
import { TOTAL_FLEX_GROW } from "../constants";

import type { LayoutItem, ResolvedLayoutItem } from "../types";
import { makeLogText } from "../utils/log";
import { clamp, EPSILON, isZero, roundTo4Digits } from "../utils/math";

interface Params {
  layout: LayoutItem[];
}

const computeSpentFlexGrow = (newFlexGrow: number, initialFlexGrow: number) =>
  Math.abs(newFlexGrow - initialFlexGrow);

const generateNewState = (
  layout: ResolvedLayoutItem[],
  flexGrowOnResizeStart: (number | undefined)[],
  resizableItemIndex: number,
  deltaSize: number
) => {
  const updatedFlexGrowValues: (number | undefined)[] = new Array(
    flexGrowOnResizeStart.length
  );
  const deltaSizeAbs = Math.abs(deltaSize);

  let remainingDeltaSizeLeftAbs = deltaSizeAbs;
  let revealedDeltaSizeLeft = 0;
  let spentDeltaSizeLeft = 0;

  const resizeDirection = Math.sign(deltaSize) < 0 ? "left" : "right";

  const tryToCollapseLeftSide = () => {
    // Now if we have some budget
    // we need to collapse items from the left side (if we're going to left)
    // We need to collapse them one by one:
    // If we don't have enough budget to collapse
    // stop iterate on items
    if (resizeDirection === "left" && remainingDeltaSizeLeftAbs > EPSILON) {
      for (let i = resizableItemIndex; i >= 0; i--) {
        if (flexGrowOnResizeStart[i] === 0) continue;

        // If we can collapse an item
        // Do this
        if (layout[i]) {
          if (layout[i].minSize < remainingDeltaSizeLeftAbs) {
            updatedFlexGrowValues[i] = 0;

            remainingDeltaSizeLeftAbs -= layout[i].minSize;
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

        // If we can collapse an item
        // Do this
        if (layout[i].collapsible) {
          if (layout[i].minSize < remainingDeltaSizeRightAbs) {
            updatedFlexGrowValues[i] = 0;

            remainingDeltaSizeRightAbs -= layout[i].minSize;
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
    if (layout[i].static) continue;

    const initialFlexGrow = flexGrowOnResizeStart[i] ?? 0;

    // We can't shrink this item even more
    if (flexGrowOnResizeStart[i] === 0 && resizeDirection === "left") continue;

    const virtualFlexGrow =
      initialFlexGrow + remainingDeltaSizeLeftAbs * Math.sign(deltaSize);

    const revealed =
      layout[i].collapsible &&
      isZero(initialFlexGrow) &&
      virtualFlexGrow > EPSILON;

    const newFlexGrow = clamp(
      virtualFlexGrow,
      layout[i].minSize,
      layout[i].maxSize
    );

    const deltaSpent = computeSpentFlexGrow(newFlexGrow, initialFlexGrow);

    spentDeltaSizeLeft += deltaSpent;

    if (revealed) revealedDeltaSizeLeft += layout[i].minSize;

    remainingDeltaSizeLeftAbs = remainingDeltaSizeLeftAbs - deltaSpent;

    updatedFlexGrowValues[i] = newFlexGrow;
  }

  tryToCollapseLeftSide();

  let remainingDeltaSizeRightAbs = deltaSizeAbs;
  let revealedDeltaSizeRight = 0;
  let spentDeltaSizeRight = 0;

  // Now try to change right side
  for (let i = resizableItemIndex + 1; i < layout.length; i++) {
    if (layout[i].static) continue;

    const initialFlexGrow = flexGrowOnResizeStart[i] ?? 0;

    // We can't shrink this item even more
    if (flexGrowOnResizeStart[i] === 0 && Math.sign(deltaSize) > 0) continue;

    const virtualFlexGrow = // Minus here is because we're changing right side
      initialFlexGrow - remainingDeltaSizeRightAbs * Math.sign(deltaSize);

    const revealed =
      layout[i].collapsible &&
      isZero(initialFlexGrow) &&
      virtualFlexGrow > EPSILON;

    const newFlexGrow = clamp(
      virtualFlexGrow,
      layout[i].minSize,
      layout[i].maxSize
    );

    const deltaSpent = computeSpentFlexGrow(newFlexGrow, initialFlexGrow);

    spentDeltaSizeRight += deltaSpent;

    if (revealed) revealedDeltaSizeRight += layout[i].minSize;

    remainingDeltaSizeRightAbs -= deltaSpent;

    updatedFlexGrowValues[i] = newFlexGrow;
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
      if (layout[i].static) continue;

      const initialFlexGrow = flexGrowOnResizeStart[i] ?? 0;
      // We can't shrink this item even more
      if (flexGrowOnResizeStart[i] === 0 && Math.sign(deltaSize) < 0) continue;

      const virtualFlexGrow =
        initialFlexGrow + remainingDeltaSizeLeftAbs * Math.sign(deltaSize);
      // we could get further on the first try
      // so if we don't have budget to resize
      // we need to clean up further items
      // We need to revisit all the items
      // to get rid of stale visual artifacts (for example, when a user resizes panel really fast)
      const newFlexGrow = clamp(
        virtualFlexGrow,
        layout[i].minSize,
        layout[i].maxSize
      );

      remainingDeltaSizeLeftAbs -= computeSpentFlexGrow(
        newFlexGrow,
        initialFlexGrow
      );

      updatedFlexGrowValues[i] = newFlexGrow;
    }

    tryToCollapseLeftSide();

    // but here we need to correct right side
  } else if (spentDeltaSizeRight - spentDeltaSizeLeft > EPSILON) {
    remainingDeltaSizeRightAbs = spentDeltaSizeLeft;

    for (let i = resizableItemIndex + 1; i < layout.length; i++) {
      if (layout[i].static) continue;

      const initialFlexGrow = flexGrowOnResizeStart[i] ?? 0;

      // We can't shrink this item even more
      if (initialFlexGrow === 0 && resizeDirection === "right") continue;

      const virtualFlexGrow =
        initialFlexGrow - remainingDeltaSizeRightAbs * Math.sign(deltaSize);
      // we could get further on the first try
      // so if we don't have budget to resize
      // we need to clean up further items
      // We need to revisit all the items
      // to get rid of stale visual artifacts (for example, when a user resizes panel really fast)

      const newFlexGrow = clamp(
        // Minus here is because we're changing right side
        virtualFlexGrow,
        layout[i].minSize,
        layout[i].maxSize
      );

      remainingDeltaSizeRightAbs -= computeSpentFlexGrow(
        newFlexGrow,
        initialFlexGrow
      );

      updatedFlexGrowValues[i] = newFlexGrow;
    }

    tryToCollapseRightSide();
  }

  return updatedFlexGrowValues;
};

const preprocessLayout = (layout: LayoutItem[]): ResolvedLayoutItem[] => {
  let itemCountWithUndefinedSize = 0;
  let spentFlexGrow = 0;

  layout.forEach((item) => {
    if (item.size) spentFlexGrow += item.size;
    else if (!item.static) itemCountWithUndefinedSize++;
  });

  const remainingFlexGrowPerItem = roundTo4Digits(
    (TOTAL_FLEX_GROW - spentFlexGrow) / itemCountWithUndefinedSize
  );

  return layout.map((item) => {
    const resolvedItem = {
      id: item.id,
      size: item.size ?? remainingFlexGrowPerItem,
      minSize: item.minSize ?? 0,
      maxSize: item.maxSize ?? Infinity,
      collapsible: Boolean(item.collapsible),
      static: Boolean(item.static),
    };

    const errorMinSize = resolvedItem.size < resolvedItem.minSize;
    const errorMaxSize = resolvedItem.size > resolvedItem.maxSize;

    if (errorMinSize || errorMaxSize)
      console.warn(
        makeLogText(
          `Error. Item with id="${
            item.id
          }" has wrong size limitations: its size (${resolvedItem.size}%) is ${
            errorMinSize ? "less" : "more"
          } than ${errorMinSize ? "minimum" : "maximum"} size (${
            errorMinSize ? resolvedItem.minSize : resolvedItem.maxSize
          }%). `
        )
      );

    return resolvedItem;
  });
};

export const createPanelStore = ({ layout }: Params) => {
  const [state, setState] = createStore(
    { layout: preprocessLayout(layout) },
    { name: "PanelStore" }
  );

  const setConfig = (layout: LayoutItem[]) =>
    setState("layout", reconcile(preprocessLayout(layout)));

  const onLayoutChange = (
    deltaSize: number,
    // TODO pass panelIndex here?
    panelId: string,
    flexGrowOnResizeStart: (undefined | number)[]
  ) => {
    const resizableItemIndex = state.layout.findIndex(
      (item) => item.id === panelId
    );

    // TODO handle error somehow
    if (resizableItemIndex === -1) return;

    const newState = generateNewState(
      state.layout,
      flexGrowOnResizeStart,
      resizableItemIndex,
      deltaSize
    );

    setState(
      produce((s) => {
        for (let i = 0; i < newState.length; i++) {
          // hate TS for this
          if (newState[i] !== undefined) s.layout[i].size = newState[i]!;
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
