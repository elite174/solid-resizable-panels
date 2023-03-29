import { createStore, produce, reconcile } from "solid-js/store";

import { ConfigItem } from "../types";

interface Params {
  config: ConfigItem[];
}

const getAllowedDeltaSize = (
  currentItem: ConfigItem,
  currentItemBeforeResize: { flexGrow: number },
  deltaSize: number
) => {
  let allowedDeltaSize = deltaSize;

  const newFlexGrow = currentItem.flexGrow + allowedDeltaSize;
  const minSize = currentItem.minFlexGrow ?? 0;
  const maxSize = currentItem.maxFlexGrow ?? Infinity;

  if (newFlexGrow < minSize) {
    // There's an edge case: deltaSize is too big to shrink, however there's some space to shrink
    // So here we need to compute smaller deltaSize to apply later
    if (currentItem.flexGrow > minSize) {
      return currentItemBeforeResize.flexGrow - minSize;
    }
  } else if (newFlexGrow >= minSize && newFlexGrow <= maxSize) {
    return Math.abs(allowedDeltaSize);
  } else if (newFlexGrow > maxSize) {
    // There's an edge case: deltaSize is too big to grow, however there's some space to grow
    // So here we need to compute smaller deltaSize to apply later
    if (currentItem.flexGrow < maxSize) {
      return maxSize - currentItemBeforeResize.flexGrow;
    }
  }

  return null;
};

const findItemsToResize = (
  currentItemIndex: number,
  deltaSize: number,
  layout: Readonly<Readonly<ConfigItem>[]>,
  stateBeforeResize: { id: string; flexGrow: number }[]
) => {
  let itemToChangeFromRight;

  for (let i = currentItemIndex + 1; i < layout.length; i++) {
    const currentItem = layout[i];

    const allowedDeltaSize = getAllowedDeltaSize(
      currentItem,
      stateBeforeResize[i],
      // If the item is from right, we need to
      -deltaSize
    );

    if (allowedDeltaSize !== null) {
      itemToChangeFromRight = {
        index: i,
        allowedDeltaSize,
      };
    }
  }

  if (!itemToChangeFromRight) return null;

  let itemToChangeFromLeft;

  for (let i = currentItemIndex; i >= 0; i--) {
    const currentItem = layout[i];

    const allowedDeltaSize = getAllowedDeltaSize(
      currentItem,
      stateBeforeResize[i],
      deltaSize
    );

    if (allowedDeltaSize !== null) {
      itemToChangeFromLeft = {
        index: i,
        allowedDeltaSize,
      };
    }
  }

  if (!itemToChangeFromLeft) return null;

  return {
    leftIndex: itemToChangeFromLeft.index,
    rightIndex: itemToChangeFromRight.index,
    deltaSize:
      Math.sign(deltaSize) *
      Math.min(
        itemToChangeFromLeft.allowedDeltaSize,
        itemToChangeFromRight.allowedDeltaSize
      ),
  };
};

export const createPanelStore = ({ config }: Params) => {
  const [state, setState] = createStore({ config }, { name: "PanelStore" });

  const setConfig = (config: ConfigItem[]) =>
    setState("config", reconcile(config));

  const onLayoutChange = (
    deltaSize: number,
    panelId: string,
    stateOnResizeStart: { id: string; flexGrow: number }[]
  ) => {
    const currentItemIndex = state.config.findIndex(
      (item) => item.id === panelId
    );

    // TODO handle error somehow
    if (currentItemIndex === -1) return;

    const itemsToResize = findItemsToResize(
      currentItemIndex,
      deltaSize,
      state.config,
      stateOnResizeStart
    );

    if (itemsToResize) {
      setState(
        produce((s) => {
          s.config[itemsToResize.leftIndex].flexGrow =
            stateOnResizeStart[itemsToResize.leftIndex].flexGrow +
            itemsToResize.deltaSize;
          s.config[itemsToResize.rightIndex].flexGrow =
            stateOnResizeStart[itemsToResize.rightIndex].flexGrow -
            itemsToResize.deltaSize;
        })
      );
    }
  };

  return {
    state,
    setConfig,
    onLayoutChange,
  };
};

export type SolidPanelStateAdapter = ReturnType<typeof createPanelStore>;
