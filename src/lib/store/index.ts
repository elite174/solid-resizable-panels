import { createStore, produce, reconcile } from "solid-js/store";

import { ConfigItem } from "../types";
import { clamp, roundTo4Digits } from "../utils/math";

interface Params {
  config: ConfigItem[];
}

const generateNewState = (
  layout: ConfigItem[],
  stateOnResizeStart: { flexGrow: number }[],
  resizableItemIndex: number,
  deltaSize: number
) => {
  const result: ({ flexGrow: number } | undefined)[] = new Array(
    stateOnResizeStart.length
  );
  const deltaSizeAbs = Math.abs(deltaSize);
  let remainingDeltaSizeLeftAbs = deltaSizeAbs;

  // Firstly try to change the left side
  for (let i = resizableItemIndex; i >= 0; i--) {
    const patchItem = {
      flexGrow: clamp(
        stateOnResizeStart[i].flexGrow +
          remainingDeltaSizeLeftAbs * Math.sign(deltaSize),
        layout[i].minFlexGrow ?? 0,
        layout[i].maxFlexGrow ?? Infinity
      ),
    };

    remainingDeltaSizeLeftAbs = roundTo4Digits(
      remainingDeltaSizeLeftAbs -
        Math.abs(patchItem.flexGrow - stateOnResizeStart[i].flexGrow)
    );

    result[i] = patchItem;

    if (remainingDeltaSizeLeftAbs === 0) break;
  }

  let remainingDeltaSizeRightAbs = deltaSizeAbs;

  // Now try to change right side
  for (let i = resizableItemIndex + 1; i < layout.length; i++) {
    const patchItem = {
      flexGrow: clamp(
        // Minus here is because we're changing right side
        stateOnResizeStart[i].flexGrow -
          remainingDeltaSizeRightAbs * Math.sign(deltaSize),
        layout[i].minFlexGrow ?? 0,
        layout[i].maxFlexGrow ?? Infinity
      ),
    };

    remainingDeltaSizeRightAbs = roundTo4Digits(
      remainingDeltaSizeRightAbs -
        Math.abs(patchItem.flexGrow - stateOnResizeStart[i].flexGrow)
    );

    result[i] = patchItem;

    if (remainingDeltaSizeRightAbs === 0) break;
  }

  // here we need to correct left side
  // because we can't resize it more than right side
  if (remainingDeltaSizeLeftAbs < remainingDeltaSizeRightAbs) {
    remainingDeltaSizeLeftAbs = deltaSizeAbs - remainingDeltaSizeRightAbs;

    for (let i = resizableItemIndex; i >= 0; i--) {
      const patchItem = {
        flexGrow: clamp(
          stateOnResizeStart[i].flexGrow +
            remainingDeltaSizeLeftAbs * Math.sign(deltaSize),
          layout[i].minFlexGrow ?? 0,
          layout[i].maxFlexGrow ?? Infinity
        ),
      };

      remainingDeltaSizeLeftAbs = roundTo4Digits(
        remainingDeltaSizeLeftAbs -
          Math.abs(patchItem.flexGrow - stateOnResizeStart[i].flexGrow)
      );

      result[i] = patchItem;

      if (remainingDeltaSizeLeftAbs === 0) break;
    }
    // but here we need to correct right side
  } else if (remainingDeltaSizeLeftAbs > remainingDeltaSizeRightAbs) {
    remainingDeltaSizeRightAbs = deltaSizeAbs - remainingDeltaSizeLeftAbs;

    for (let i = resizableItemIndex + 1; i < layout.length; i++) {
      const patchItem = {
        flexGrow: clamp(
          // Minus here is because we're changing right side
          stateOnResizeStart[i].flexGrow -
            remainingDeltaSizeRightAbs * Math.sign(deltaSize),
          layout[i].minFlexGrow ?? 0,
          layout[i].maxFlexGrow ?? Infinity
        ),
      };

      remainingDeltaSizeRightAbs = roundTo4Digits(
        remainingDeltaSizeRightAbs -
          Math.abs(patchItem.flexGrow - stateOnResizeStart[i].flexGrow)
      );

      result[i] = patchItem;

      if (remainingDeltaSizeRightAbs === 0) break;
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
    stateOnResizeStart: { id: string; flexGrow: number }[]
  ) => {
    const currentItemIndex = state.config.findIndex(
      (item) => item.id === panelId
    );

    // TODO handle error somehow
    if (currentItemIndex === -1) return;

    const patch = generateNewState(
      state.config,
      stateOnResizeStart,
      currentItemIndex,
      deltaSize
    );

    setState(
      produce((s) => {
        for (let i = 0; i < patch.length; i++) {
          const patchItem = patch[i];

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
