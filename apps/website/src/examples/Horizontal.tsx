import type { VoidComponent } from "solid-js";
import { Panel, PanelGroup, ResizeHandle } from "solid-resizable-panels";
import "solid-resizable-panels/styles.css";

export const Horizontal: VoidComponent = () => (
  <PanelGroup>
    <Panel id="1">Hi</Panel>
    <ResizeHandle />
    <Panel id="2">Hi</Panel>
    <ResizeHandle />
    <Panel id="3">Hi</Panel>
  </PanelGroup>
);
