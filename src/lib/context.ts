import { Accessor, createContext } from "solid-js";
import { LayoutItem, ResolvedLayoutItem } from "./types";

export interface PanelContext {
  registerPanel: (panelData: LayoutItem, index?: number) => void;
  unregisterPanel: (panelId: string) => void;
  useData: (panelId: string) => Accessor<ResolvedLayoutItem | undefined>;
  createMouseDownHandler: (
    panelId: Accessor<string>
  ) => (e: MouseEvent) => void;
  getHandleId: () => string;
}

export const PanelContext = createContext<PanelContext>();
