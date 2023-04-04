import type { VoidComponent } from 'solid-js';
import { ResizeHandle } from 'solid-resizable-panels';

import { PanelGroup, Panel } from '../components';

export const Vertical: VoidComponent = () => (
  <PanelGroup direction="column">
    <Panel id="1">Panel 1</Panel>
    <ResizeHandle />
    <Panel id="2">Panel 1</Panel>
    <ResizeHandle />
    <Panel id="3">Panel 1</Panel>
  </PanelGroup>
);

export const verticalCode = `<PanelGroup direction="column">
  <Panel id="1">Panel 1</Panel>
  <ResizeHandle />
  <Panel id="2">Panel 1</Panel>
  <ResizeHandle />
  <Panel id="3">Panel 1</Panel>
</PanelGroup>
`;
