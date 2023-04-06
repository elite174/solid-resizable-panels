import type { ResolvedLayoutItem } from '../types';
import { EPSILON, clamp, isZero } from '../utils/math';

// TODO refactor this and add tests
export const newStateAlgorithm = (
  resolvedLayout: ResolvedLayoutItem[],
  flexGrowOnResizeStart: number[],
  resizableItemIndex: number,
  deltaSize: number,
): number[] => {
  let result = flexGrowOnResizeStart.slice();
  let resizeDirection = Math.sign(deltaSize) === 1 ? 'right' : 'left';
  let totalBudget = Math.abs(deltaSize);
  const sign = resizeDirection === 'left' ? -1 : 1;

  const itemCount = resolvedLayout.length;

  // try to enlarge nearest item from the opposite side
  const nextItemIndex = resizeDirection === 'left' ? resizableItemIndex + 1 : resizableItemIndex;
  // minus because it's right
  const nextItemVirtualSize =
    flexGrowOnResizeStart[nextItemIndex] + sign * Math.sign(deltaSize) * totalBudget;
  const nextItemActualSize = clamp(
    nextItemVirtualSize,
    resolvedLayout[nextItemIndex].minSize,
    resolvedLayout[nextItemIndex].maxSize,
  );

  // if next item is collapsed
  // try to expand it
  if (resolvedLayout[nextItemIndex].collapsible && flexGrowOnResizeStart[nextItemIndex] === 0) {
    // if we can't expand it: return initial state
    if (nextItemVirtualSize < resolvedLayout[nextItemIndex].minSize) return flexGrowOnResizeStart;
  }

  // update next item size
  result[nextItemIndex] = nextItemActualSize;

  // now try to shrink items
  let remainingBudget = Math.min(
    resolvedLayout[nextItemIndex].maxSize - flexGrowOnResizeStart[nextItemIndex],
    totalBudget,
  );
  let spentBudget = 0;

  const initIndex = () =>
    resizeDirection === 'left' ? resizableItemIndex : resizableItemIndex + 1;
  const checkCondition = (index: number) =>
    resizeDirection === 'left' ? index >= 0 : index < itemCount;
  const getNextIndex = (index: number) => (resizeDirection === 'left' ? index - 1 : index + 1);

  let index = initIndex();

  // shrink size
  while (checkCondition(index)) {
    // can't shrink more
    if (flexGrowOnResizeStart[index] === 0) {
      index = getNextIndex(index);

      continue;
    }

    const virtualSize =
      flexGrowOnResizeStart[index] - sign * Math.sign(deltaSize) * remainingBudget;

    const actualSize = clamp(
      virtualSize,
      resolvedLayout[index].minSize,
      resolvedLayout[index].maxSize,
    );

    const deltaSpent = flexGrowOnResizeStart[index] - actualSize;

    remainingBudget -= deltaSpent;
    spentBudget += deltaSpent;
    result[index] = actualSize;

    index = getNextIndex(index);

    // if we ran out of budget it means
    // that we updated all the items
    // don't need to do anything after
    if (isZero(remainingBudget)) return result;
  }

  // here we have some budget to shrink
  // so it means we need to try to collapse items

  index = initIndex();

  while (checkCondition(index)) {
    // can't shrink more
    if (flexGrowOnResizeStart[index] === 0) {
      index = getNextIndex(index);

      continue;
    }

    // if we can collapse item do it
    if (resolvedLayout[index].collapsible && remainingBudget >= resolvedLayout[index].minSize) {
      remainingBudget -= resolvedLayout[index].minSize;
      spentBudget += resolvedLayout[index].minSize;
      result[index] = 0;
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
    result[nextItemIndex] = clamp(
      flexGrowOnResizeStart[nextItemIndex] + sign * Math.sign(deltaSize) * spentBudget,
      resolvedLayout[nextItemIndex].minSize,
      resolvedLayout[nextItemIndex].maxSize,
    );
  }

  return result;
};

export type ResizeAlgorithm = typeof newStateAlgorithm;
