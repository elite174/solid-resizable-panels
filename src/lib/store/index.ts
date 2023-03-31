import { createStore, produce, reconcile } from "solid-js/store";

import type { ConfigItem, ItemStateOnResizeStart } from "../types";
import { clamp, EPSILON, isZero } from "../utils/math";

interface Params {
  config: ConfigItem[];
}

const computeSpentFlexGrow = (newFlexGrow: number, initialFlexGrow: number) =>
  Math.abs(newFlexGrow - initialFlexGrow);

const generateNewState = (
  layout: ConfigItem[],
  stateOnResizeStart: ItemStateOnResizeStart[],
  resizableItemIndex: number,
  deltaSize: number
) => {
  const result: (ItemStateOnResizeStart | undefined)[] = new Array(
    stateOnResizeStart.length
  );
  const deltaSizeAbs = Math.abs(deltaSize);

  let remainingDeltaSizeLeftAbs = deltaSizeAbs;
  let revealedDeltaSizeLeft = 0;
  let spentDeltaSizeLeft = 0;

  // Below we try to resize all the items from the left side
  // and from the right side.
  // We cannot skip items or break the loop if we spent all resize budget
  // because of visual bugs (fast resize)

  // Firstly try to change the left side
  for (let i = resizableItemIndex; i >= 0; i--) {
    // We can't shrink this item even more
    if (stateOnResizeStart[i].flexGrow === 0 && Math.sign(deltaSize) < 0)
      continue;

    const virtualFlexGrow =
      stateOnResizeStart[i].flexGrow +
      remainingDeltaSizeLeftAbs * Math.sign(deltaSize);

    const revealed =
      layout[i].collapsible &&
      isZero(stateOnResizeStart[i].flexGrow) &&
      virtualFlexGrow > EPSILON;

    const newFlexGrow = clamp(
      virtualFlexGrow,
      layout[i].minFlexGrow ?? 0,
      layout[i].maxFlexGrow ?? Infinity
    );

    const patchItem = {
      flexGrow: newFlexGrow,
    };

    const deltaSpent = computeSpentFlexGrow(
      patchItem.flexGrow,
      stateOnResizeStart[i].flexGrow
    );

    spentDeltaSizeLeft += deltaSpent;

    if (revealed) revealedDeltaSizeLeft += layout[i].minFlexGrow ?? 0;

    remainingDeltaSizeLeftAbs = remainingDeltaSizeLeftAbs - deltaSpent;

    result[i] = patchItem;
  }

  // Now if we have some budget
  // we need to collapse items from the left side (if we're going to left)
  // We need to collapse them one by one:
  // If we don't have enough budget to collapse
  // stop iterate on items
  if (Math.sign(deltaSize) < 0 && remainingDeltaSizeLeftAbs > EPSILON) {
    for (let i = resizableItemIndex; i >= 0; i--) {
      if (stateOnResizeStart[i].flexGrow === 0) continue;

      const currentItem = layout[i];

      // If we can collapse an item
      // Do this
      if (currentItem.collapsible) {
        if (currentItem.minFlexGrow < remainingDeltaSizeLeftAbs) {
          if (result[i]) {
            // hate TS for this
            result[i]!.flexGrow = 0;
          } else {
            result[i] = { flexGrow: 0 };
          }

          remainingDeltaSizeLeftAbs -= currentItem.minFlexGrow;
          // Don't need to iterate further because we don't have enough budget to collapse nearest item
        } else break;
      }
    }
  }

  let remainingDeltaSizeRightAbs = deltaSizeAbs;
  let revealedDeltaSizeRight = 0;
  let spentDeltaSizeRight = 0;

  // Now try to change right side
  for (let i = resizableItemIndex + 1; i < layout.length; i++) {
    // We can't shrink this item even more
    if (stateOnResizeStart[i].flexGrow === 0 && Math.sign(deltaSize) > 0)
      continue;

    const virtualFlexGrow = // Minus here is because we're changing right side
      stateOnResizeStart[i].flexGrow -
      remainingDeltaSizeRightAbs * Math.sign(deltaSize);

    const revealed =
      layout[i].collapsible &&
      isZero(stateOnResizeStart[i].flexGrow) &&
      virtualFlexGrow > EPSILON;

    const newFlexGrow = clamp(
      virtualFlexGrow,
      layout[i].minFlexGrow ?? 0,
      layout[i].maxFlexGrow ?? Infinity
    );

    const patchItem = {
      flexGrow: newFlexGrow,
    };

    const deltaSpent = computeSpentFlexGrow(
      patchItem.flexGrow,
      stateOnResizeStart[i].flexGrow
    );

    spentDeltaSizeRight += deltaSpent;

    if (revealed) revealedDeltaSizeRight += layout[i].minFlexGrow ?? 0;

    remainingDeltaSizeRightAbs = remainingDeltaSizeRightAbs - deltaSpent;

    result[i] = patchItem;
  }

  // Now if we have some budget
  // we need to collapse items from the right side
  // We need to collapse them one by one:
  // If we don't have enough budget to collapse
  // stop iterate on items
  if (Math.sign(deltaSize) > 0 && remainingDeltaSizeRightAbs > EPSILON) {
    for (let i = resizableItemIndex + 1; i < layout.length; i++) {
      // We can't shrink this item even more
      if (stateOnResizeStart[i].flexGrow === 0) continue;

      const currentItem = layout[i];

      // If we can collapse an item
      // Do this
      if (currentItem.collapsible) {
        if (currentItem.minFlexGrow < remainingDeltaSizeRightAbs) {
          if (result[i]) {
            // hate TS for this
            result[i]!.flexGrow = 0;
          } else {
            result[i] = { flexGrow: 0 };
          }

          remainingDeltaSizeRightAbs -= currentItem.minFlexGrow;
          // Don't need to iterate further because we don't have enough budget to collapse nearest item
        } else break;
      }
    }
  }

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
      if (stateOnResizeStart[i].flexGrow === 0 && Math.sign(deltaSize) < 0)
        continue;

      const virtualFlexGrow =
        stateOnResizeStart[i].flexGrow +
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

      const patchItem = {
        flexGrow: newFlexGrow,
      };

      remainingDeltaSizeLeftAbs =
        remainingDeltaSizeLeftAbs -
        Math.abs(patchItem.flexGrow - stateOnResizeStart[i].flexGrow);

      result[i] = patchItem;
    }

    if (Math.sign(deltaSize) < 0 && remainingDeltaSizeLeftAbs > EPSILON) {
      for (let i = resizableItemIndex; i >= 0; i--) {
        // We can't shrink this item even more
        if (stateOnResizeStart[i].flexGrow === 0) continue;

        const currentItem = layout[i];

        // If we can collapse an item
        // Do this
        if (currentItem.collapsible) {
          if (currentItem.minFlexGrow < remainingDeltaSizeLeftAbs) {
            if (result[i]) {
              // hate TS for this
              result[i]!.flexGrow = 0;
            } else {
              result[i] = { flexGrow: 0 };
            }

            remainingDeltaSizeLeftAbs -= currentItem.minFlexGrow;
            // Don't need to iterate further because we don't have enough budget to collapse nearest item
          } else break;
        }
      }
    }

    // but here we need to correct right side
  } else if (spentDeltaSizeRight - spentDeltaSizeLeft > EPSILON) {
    remainingDeltaSizeRightAbs = spentDeltaSizeLeft;

    for (let i = resizableItemIndex + 1; i < layout.length; i++) {
      // We can't shrink this item even more
      if (stateOnResizeStart[i].flexGrow === 0 && Math.sign(deltaSize) > 0)
        continue;

      const virtualFlexGrow =
        stateOnResizeStart[i].flexGrow -
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

      const patchItem = {
        flexGrow: newFlexGrow,
      };

      remainingDeltaSizeRightAbs =
        remainingDeltaSizeRightAbs -
        Math.abs(patchItem.flexGrow - stateOnResizeStart[i].flexGrow);

      result[i] = patchItem;
    }

    if (Math.sign(deltaSize) > 0 && remainingDeltaSizeRightAbs > EPSILON) {
      for (let i = resizableItemIndex + 1; i < layout.length; i++) {
        // We can't shrink this item even more
        if (stateOnResizeStart[i].flexGrow === 0) continue;

        const currentItem = layout[i];

        // If we can collapse an item
        // Do this
        if (currentItem.collapsible) {
          if (currentItem.minFlexGrow < remainingDeltaSizeRightAbs) {
            if (result[i]) {
              // hate TS for this
              result[i]!.flexGrow = 0;
            } else {
              result[i] = { flexGrow: 0 };
            }

            remainingDeltaSizeRightAbs -= currentItem.minFlexGrow;
            // Don't need to iterate further because we don't have enough budget to collapse nearest item
          } else break;
        }
      }
    }
  }

  return result;
};

export const createPanelStore = ({ config }: Params) => {
  const [state, setState] = createStore({ config }, { name: "PanelStore" });

  const setConfig = (config: ConfigItem[]) =>
    setState("config", reconcile(config));

  const onLayoutChange = (
    deltaSize: number,
    panelId: string,
    stateOnResizeStart: ItemStateOnResizeStart[]
  ) => {
    const resizableItemIndex = state.config.findIndex(
      (item) => item.id === panelId
    );

    // TODO handle error somehow
    if (resizableItemIndex === -1) return;

    const newState = generateNewState(
      state.config,
      stateOnResizeStart,
      resizableItemIndex,
      deltaSize
    );

    setState(
      produce((s) => {
        for (let i = 0; i < newState.length; i++) {
          const patchItem = newState[i];

          if (patchItem) s.config[i].flexGrow = patchItem.flexGrow;
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
