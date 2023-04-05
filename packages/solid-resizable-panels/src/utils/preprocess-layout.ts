import type { LayoutItem, ResolvedLayoutItem } from '../types';

import { TOTAL_FLEX_GROW } from '../constants';
import { makeLogText } from './log';
import { roundTo4Digits } from './math';

export const preprocessLayout = (layout: LayoutItem[]): ResolvedLayoutItem[] => {
  let itemCountWithUndefinedSize = 0;
  let spentFlexGrow = 0;

  layout.forEach((item) => {
    if (item.size) spentFlexGrow += item.size;
    else itemCountWithUndefinedSize++;
  });

  const remainingFlexGrowPerItem = roundTo4Digits(
    (TOTAL_FLEX_GROW - spentFlexGrow) / itemCountWithUndefinedSize,
  );

  return layout.map((item) => {
    const resolvedItem = {
      id: item.id,
      size: item.size ?? remainingFlexGrowPerItem,
      minSize: item.minSize,
      maxSize: item.maxSize,
      collapsible: item.collapsible,
    };

    const errorMinSize = resolvedItem.size < resolvedItem.minSize;
    const errorMaxSize = resolvedItem.size > resolvedItem.maxSize;

    if (errorMinSize || errorMaxSize)
      console.warn(
        makeLogText(
          `Error. Item with id="${item.id}" has wrong size limitations: its size (${
            resolvedItem.size
          }%) is ${errorMinSize ? 'less' : 'more'} than ${
            errorMinSize ? 'minimum' : 'maximum'
          } size (${errorMinSize ? resolvedItem.minSize : resolvedItem.maxSize}%). `,
        ),
      );

    return resolvedItem;
  });
};
