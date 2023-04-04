import type { VoidComponent } from 'solid-js';
import { ResizeHandle } from 'solid-resizable-panels';

import { PanelGroup, Panel } from '../components';
import { Horizontal } from './Horizontal';

export const Nested: VoidComponent = () => (
  <PanelGroup direction="column">
    <Panel id="1">Panel 1</Panel>
    <ResizeHandle />
    <Panel id="2">
      <Horizontal />
    </Panel>
    <ResizeHandle />
    <Panel id="3">Panel 3</Panel>
  </PanelGroup>
);

export const nestedCode = `<PanelGroup direction="column">
  <Panel id="1">Panel 1</Panel>
  <ResizeHandle />
  <Panel id="2">
    <PanelGroup>
      <Panel id="1">Panel 1</Panel>
      <ResizeHandle />
      <Panel id="2">Panel 2</Panel>
      <ResizeHandle />
      <Panel id="3">Panel 3</Panel>
    </PanelGroup>
  </Panel>
  <ResizeHandle />
  <Panel id="3">Panel 3</Panel>
</PanelGroup>
`;
