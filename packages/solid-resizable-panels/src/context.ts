import { Accessor, createContext } from 'solid-js';

import type { LayoutItem, ResolvedLayoutItem } from './types';
import type { MouseDownHandlerCreator } from './hooks/use-resize';

export interface IPanelContext {
  registerPanel: (panelData: LayoutItem, index?: number) => void;
  unregisterPanel: (panelId: string) => void;
  useData: (panelId: string) => Accessor<ResolvedLayoutItem | undefined>;
  createMouseDownHandler: MouseDownHandlerCreator;
  getHandleId: () => string;
}

export const PanelContext = createContext<IPanelContext>();
