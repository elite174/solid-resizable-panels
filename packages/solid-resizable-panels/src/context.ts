import { type Accessor, createContext } from 'solid-js';

import type { LayoutItem, ResolvedLayoutItem } from './types';

export interface IPanelContext {
  registerPanel: (panelData: LayoutItem, index?: number) => void;
  unregisterPanel: (panelId: string) => void;
  useData: (panelId: string) => Accessor<ResolvedLayoutItem | undefined>;
  createMouseDownHandler: any;
}

export const PanelContext = createContext<IPanelContext>();
