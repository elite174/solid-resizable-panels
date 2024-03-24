import type { ResolvedLayoutItem } from "../types";

const EPSILON = 0.000001;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));

const isZero = (value: number) => Math.abs(value) < EPSILON;

export type ResizeAlgorithm = (
  /** Current state of layout */
  resolvedLayout: ResolvedLayoutItem[],
  sizesOnResizeStart: number[],
  resizableItemIndex: number,
  /**
   * Delta size is computed from the initial size (before resize) and current state
   */
  deltaSize: number
) => number[];

export const RESIZE_ALGORITHM: ResizeAlgorithm = (
  /** Current state of layout */
  resolvedLayout,
  sizesOnResizeStart,
  resizableItemIndex,
  deltaSize
) => {
  if (resizableItemIndex === resolvedLayout.length - 1) {
    resizableItemIndex--;
    deltaSize = -deltaSize;
  }

  let updatedSizes = sizesOnResizeStart.slice();
  const resizeDirection = Math.sign(deltaSize) === 1 ? "right" : "left";
  const totalBudget = Math.abs(deltaSize);
  const sign = (resizeDirection === "left" ? -1 : 1) * Math.sign(deltaSize);

  const itemCount = resolvedLayout.length;

  // try to enlarge nearest item from the opposite side
  const nextItemIndex = resizeDirection === "left" ? resizableItemIndex + 1 : resizableItemIndex;
  const nextItemVirtualSize = sizesOnResizeStart[nextItemIndex] + sign * totalBudget;
  const nextItemActualSize = clamp(
    nextItemVirtualSize,
    resolvedLayout[nextItemIndex].minSize,
    resolvedLayout[nextItemIndex].maxSize
  );

  // if next item is collapsed
  // try to expand it
  if (resolvedLayout[nextItemIndex].collapsible && sizesOnResizeStart[nextItemIndex] === 0) {
    // if we can't expand it: return initial state
    if (nextItemVirtualSize < resolvedLayout[nextItemIndex].minSize) return sizesOnResizeStart;
  }

  // update next item size
  updatedSizes[nextItemIndex] = nextItemActualSize;

  // now try to shrink items from opposite side
  // We have some budget to spend on changing the sizes
  let remainingBudget = Math.min(
    resolvedLayout[nextItemIndex].maxSize - sizesOnResizeStart[nextItemIndex],
    totalBudget
  );
  let spentBudget = 0;

  // I tried to generalize the algorithm for both directions
  // That's why we need this
  const getInitialIndex = () => (resizeDirection === "left" ? resizableItemIndex : resizableItemIndex + 1);
  const canGoNext = (index: number) => (resizeDirection === "left" ? index >= 0 : index < itemCount);
  const getNextIndex = (index: number) => (resizeDirection === "left" ? index - 1 : index + 1);

  let index = getInitialIndex();

  // shrink size
  while (canGoNext(index)) {
    // can't shrink more
    if (sizesOnResizeStart[index] === 0) {
      index = getNextIndex(index);

      continue;
    }

    // Minus here because we go to another direction
    const virtualSize = sizesOnResizeStart[index] - sign * remainingBudget;

    const actualSize = clamp(virtualSize, resolvedLayout[index].minSize, resolvedLayout[index].maxSize);

    const deltaSpent = sizesOnResizeStart[index] - actualSize;

    remainingBudget -= deltaSpent;
    spentBudget += deltaSpent;
    updatedSizes[index] = actualSize;

    index = getNextIndex(index);

    // if we ran out of budget it means
    // that we updated all the items
    // don't need to do anything after
    if (isZero(remainingBudget)) return updatedSizes;
  }

  // here we have some budget to shrink
  // so it means we need to try to collapse items

  index = getInitialIndex();

  while (canGoNext(index)) {
    // can't shrink more
    if (sizesOnResizeStart[index] === 0) {
      index = getNextIndex(index);

      continue;
    }

    // if we can collapse item do it
    if (resolvedLayout[index].collapsible && remainingBudget >= resolvedLayout[index].minSize) {
      remainingBudget -= resolvedLayout[index].minSize;
      spentBudget += resolvedLayout[index].minSize;
      updatedSizes[index] = 0;
    }

    index = getNextIndex(index);

    // if we ran out of budget just stop iterate
    // we need to do one more check next
    if (isZero(remainingBudget)) break;
  }

  // if we still have some budget to spend
  // if means that we can't allocate all the space
  // that we got from the item from opposite side
  // so we need to correct that item size
  if (remainingBudget > EPSILON) {
    updatedSizes[nextItemIndex] = clamp(
      sizesOnResizeStart[nextItemIndex] + sign * spentBudget,
      resolvedLayout[nextItemIndex].minSize,
      resolvedLayout[nextItemIndex].maxSize
    );
  }

  return updatedSizes;
};
