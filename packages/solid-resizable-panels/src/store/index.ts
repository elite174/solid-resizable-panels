import { createStore, produce, reconcile } from 'solid-js/store';
import type { Accessor } from 'solid-js';
import { createMemo, untrack } from 'solid-js';

import type { ResolvedLayoutItem } from '../types';
import { roundTo4Digits } from '../utils/math';
import { newStateAlgorithm, ResizeAlgorithm } from './algorithm';

export const createPanelStore = (
  resolvedLayout: ResolvedLayoutItem[],
  resizeAlgorithm: Accessor<ResizeAlgorithm | undefined>,
  onLayoutChange?: (sizes: number[]) => void,
) => {
  const [state, setState] = createStore({ layout: resolvedLayout }, { name: 'PanelStore' });

  const setConfig = (resolvedLayout: ResolvedLayoutItem[]) =>
    setState('layout', reconcile(resolvedLayout));

  const generateNewStateAlgorithm = createMemo(() => resizeAlgorithm() ?? newStateAlgorithm);

  const updateLayout = (deltaSize: number, panelId: string, flexGrowOnResizeStart: number[]) => {
    const resizableItemIndex = state.layout.findIndex((item) => item.id === panelId);

    // TODO handle error somehow
    if (resizableItemIndex === -1) return;

    const newState = untrack(generateNewStateAlgorithm)(
      state.layout,
      flexGrowOnResizeStart,
      resizableItemIndex,
      deltaSize,
      // round values
    ).map(roundTo4Digits);

    setState(
      produce((s) => {
        for (let i = 0; i < newState.length; i++) {
          // hate TS for this
          if (newState[i] !== undefined) s.layout[i].size = newState[i]!;
        }
      }),
    );

    onLayoutChange?.(newState);
  };

  return {
    state,
    setConfig,
    updateLayout,
  };
};

export type CreatePanelStore = ReturnType<typeof createPanelStore>;
