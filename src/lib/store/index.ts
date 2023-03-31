import { createStore, produce, reconcile } from "solid-js/store";

import { ConfigItem, ItemStateOnResizeStart } from "../types";
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
  const result: ({ flexGrow: number; collapsed?: boolean } | undefined)[] =
    new Array(stateOnResizeStart.length);
  const deltaSizeAbs = Math.abs(deltaSize);

  let remainingDeltaSizeLeftAbs = deltaSizeAbs;
  let spentLeftDeltaSize = 0;

  // Below we try to resize all the items from the left side
  // and from the right side.
  // We cannot skip items or break the loop if we spent all resize budget
  // because of visual bugs (fast resize)

  // Firstly try to change the left side
  for (let i = resizableItemIndex; i >= 0; i--) {
    const newFlexGrow = clamp(
      stateOnResizeStart[i].flexGrow +
        remainingDeltaSizeLeftAbs * Math.sign(deltaSize),
      layout[i].minFlexGrow ?? 0,
      layout[i].maxFlexGrow ?? Infinity
    );
    const virtualFlexGrow =
      stateOnResizeStart[i].flexGrow +
      remainingDeltaSizeLeftAbs * Math.sign(deltaSize);

    console.log(i, virtualFlexGrow);

    const patchItem = {
      flexGrow: newFlexGrow,
    };

    const deltaSpent = computeSpentFlexGrow(
      patchItem.flexGrow,
      stateOnResizeStart[i].flexGrow
    );

    spentLeftDeltaSize += deltaSpent;

    remainingDeltaSizeLeftAbs = remainingDeltaSizeLeftAbs - deltaSpent;

    result[i] = patchItem;
  }

  let remainingDeltaSizeRightAbs = deltaSizeAbs;
  let spentRightDeltaSize = 0;

  // Now try to change right side
  for (let i = resizableItemIndex + 1; i < layout.length; i++) {
    const newFlexGrow = clamp(
      // Minus here is because we're changing right side
      stateOnResizeStart[i].flexGrow -
        remainingDeltaSizeRightAbs * Math.sign(deltaSize),
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

    spentRightDeltaSize += deltaSpent;

    remainingDeltaSizeRightAbs = remainingDeltaSizeRightAbs - deltaSpent;

    result[i] = patchItem;
  }

  // here we need to correct left side
  // because we can't resize it more than right side
  if (spentLeftDeltaSize - spentRightDeltaSize > EPSILON) {
    remainingDeltaSizeLeftAbs = spentRightDeltaSize;

    for (let i = resizableItemIndex; i >= 0; i--) {
      // we could get further on the first try
      // so if we don't have budget to resize
      // we need to clean up further items
      // We need to revisit all the items
      // to get rid of stale visual artifacts (for example, when a user resizes panel really fast)
      const newFlexGrow = clamp(
        stateOnResizeStart[i].flexGrow +
          remainingDeltaSizeLeftAbs * Math.sign(deltaSize),
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

    // but here we need to correct right side
  } else if (Math.abs(spentLeftDeltaSize - spentRightDeltaSize) > EPSILON) {
    remainingDeltaSizeRightAbs = spentLeftDeltaSize;

    for (let i = resizableItemIndex + 1; i < layout.length; i++) {
      // we could get further on the first try
      // so if we don't have budget to resize
      // we need to clean up further items
      // We need to revisit all the items
      // to get rid of stale visual artifacts (for example, when a user resizes panel really fast)

      const newFlexGrow = clamp(
        // Minus here is because we're changing right side
        stateOnResizeStart[i].flexGrow -
          remainingDeltaSizeRightAbs * Math.sign(deltaSize),
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
