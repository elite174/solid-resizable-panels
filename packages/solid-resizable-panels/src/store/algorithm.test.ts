import { describe, test, expect } from 'vitest';

import { newStateAlgorithm } from './algorithm';

describe('newStateAlgorithm', () => {
  test('it should correctly resize an item', () => {
    const resolvedLayout = [
      { id: '1', size: 50, minSize: 20, maxSize: 80, collapsible: true },
      { id: '2', size: 50, minSize: 20, maxSize: 80, collapsible: true },
    ];
    const sizesOnResizeStart = [50, 50];
    const resizableItemIndex = 0;
    const deltaSize = 10;
    const result = newStateAlgorithm(
      resolvedLayout,
      sizesOnResizeStart,
      resizableItemIndex,
      deltaSize,
    );
    expect(result).toEqual([60, 40]);
  });

  test('it should correctly resize an item in the other direction', () => {
    const resolvedLayout = [
      { id: '1', size: 50, minSize: 20, maxSize: 80, collapsible: true },
      { id: '2', size: 50, minSize: 20, maxSize: 80, collapsible: true },
    ];
    const sizesOnResizeStart = [50, 50];
    const resizableItemIndex = 1;
    const deltaSize = 10;
    const result = newStateAlgorithm(
      resolvedLayout,
      sizesOnResizeStart,
      resizableItemIndex,
      deltaSize,
    );
    expect(result).toEqual([40, 60]);
  });
  test('it should correctly resize an item with a minSize', () => {
    const resolvedLayout = [
      { id: '1', size: 50, minSize: 20, maxSize: 80, collapsible: true },
      { id: '2', size: 50, minSize: 20, maxSize: 80, collapsible: true },
    ];
    const sizesOnResizeStart = [50, 50];
    const resizableItemIndex = 0;
    const deltaSize = -40;
    const result = newStateAlgorithm(
      resolvedLayout,
      sizesOnResizeStart,
      resizableItemIndex,
      deltaSize,
    );
    expect(result).toEqual([20, 80]);
  });
  test('it should correctly resize an item with a maxSize', () => {
    const resolvedLayout = [
      { id: '1', size: 50, minSize: 20, maxSize: 80, collapsible: true },
      { id: '2', size: 50, minSize: 20, maxSize: 80, collapsible: true },
    ];
    const sizesOnResizeStart = [50, 50];
    const resizableItemIndex = 0;
    const deltaSize = 40;
    const result = newStateAlgorithm(
      resolvedLayout,
      sizesOnResizeStart,
      resizableItemIndex,
      deltaSize,
    );
    expect(result).toEqual([80, 20]);
  });
  test('it should correctly resize an item with a minSize and maxSize', () => {
    const resolvedLayout = [
      { id: '1', size: 50, minSize: 20, maxSize: 80, collapsible: true },
      { id: '2', size: 50, minSize: 20, maxSize: 80, collapsible: true },
    ];
    const sizesOnResizeStart = [50, 50];
    const resizableItemIndex = 0;
    const deltaSize = -60;
    const result = newStateAlgorithm(
      resolvedLayout,
      sizesOnResizeStart,
      resizableItemIndex,
      deltaSize,
    );
    expect(result).toEqual([20, 80]);
  });
  test('it should correctly resize an item with a minSize and maxSize in the other direction', () => {
    const resolvedLayout = [
      { id: '1', size: 50, minSize: 20, maxSize: 80, collapsible: true },
      { id: '2', size: 50, minSize: 20, maxSize: 80, collapsible: true },
    ];
    const sizesOnResizeStart = [50, 50];
    const resizableItemIndex = 1;
    const deltaSize = 60;
    const result = newStateAlgorithm(
      resolvedLayout,
      sizesOnResizeStart,
      resizableItemIndex,
      deltaSize,
    );
    expect(result).toEqual([20, 80]);
  });

  test('it should collapse an item if there is not enough space', () => {
    const resolvedLayout = [
      { id: '1', size: 50, minSize: 20, maxSize: 100, collapsible: true },
      { id: '2', size: 50, minSize: 20, maxSize: 100, collapsible: true },
    ];
    const sizesOnResizeStart = [50, 50];
    const resizableItemIndex = 0;
    const deltaSize = -60;
    const result = newStateAlgorithm(
      resolvedLayout,
      sizesOnResizeStart,
      resizableItemIndex,
      deltaSize,
    );
    expect(result).toEqual([0, 100]);
  });

  test('it should collapse an item if there is not enough space in the other direction', () => {
    const resolvedLayout = [
      { id: '1', size: 50, minSize: 20, maxSize: 100, collapsible: true },
      { id: '2', size: 50, minSize: 20, maxSize: 100, collapsible: true },
    ];
    const sizesOnResizeStart = [50, 50];
    const resizableItemIndex = 1;
    const deltaSize = 60;
    const result = newStateAlgorithm(
      resolvedLayout,
      sizesOnResizeStart,
      resizableItemIndex,
      deltaSize,
    );
    expect(result).toEqual([0, 100]);
  });

  test('it should not collapse an item if it is not collapsible', () => {
    const resolvedLayout = [
      { id: '1', size: 50, minSize: 20, maxSize: 100, collapsible: false },
      { id: '2', size: 50, minSize: 20, maxSize: 100, collapsible: true },
    ];
    const sizesOnResizeStart = [50, 50];
    const resizableItemIndex = 0;
    const deltaSize = -60;
    const result = newStateAlgorithm(
      resolvedLayout,
      sizesOnResizeStart,
      resizableItemIndex,
      deltaSize,
    );
    expect(result).toEqual([20, 80]);
  });

  test('it should collapse an item in the middle', () => {
    const resolvedLayout = [
      { id: '1', size: 30, minSize: 30, maxSize: 100, collapsible: true },
      { id: '2', size: 50, minSize: 20, maxSize: 100, collapsible: true },
      { id: '3', size: 20, minSize: 20, maxSize: 100, collapsible: true },
    ];
    const sizesOnResizeStart = [30, 50, 20];
    const resizableItemIndex = 1;
    const deltaSize = -50;
    const result = newStateAlgorithm(
      resolvedLayout,
      sizesOnResizeStart,
      resizableItemIndex,
      deltaSize,
    );
    expect(result).toEqual([30, 0, 70]);
  });
});
