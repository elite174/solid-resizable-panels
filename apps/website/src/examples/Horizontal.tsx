import type { VoidComponent } from 'solid-js';
import { ResizeHandle } from 'solid-resizable-panels';

import { PanelGroup, Panel } from '../components';

export const Horizontal: VoidComponent = () => (
  <PanelGroup>
    <Panel id="1">Panel 1</Panel>
    <ResizeHandle />
    <Panel id="2">Panel 2</Panel>
    <ResizeHandle />
    <Panel id="3">Panel 3</Panel>
  </PanelGroup>
);

export const horizontalCode = `<PanelGroup>
  <Panel id="1">Panel 1</Panel>
  <ResizeHandle />
  <Panel id="2">Panel 2</Panel>
  <ResizeHandle />
  <Panel id="3">Panel 3</Panel>
</PanelGroup>
`;
