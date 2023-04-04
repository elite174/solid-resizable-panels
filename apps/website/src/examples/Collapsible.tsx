import type { VoidComponent } from 'solid-js';
import { ResizeHandle } from 'solid-resizable-panels';

import { PanelGroup, Panel } from '../components';

export const Collapsible: VoidComponent = () => (
  <PanelGroup>
    <Panel id="1" minSize={20} collapsible>
      Panel 1
    </Panel>
    <ResizeHandle />
    <Panel id="2" minSize={20}>
      Panel 2
    </Panel>
    <ResizeHandle />
    <Panel id="3" minSize={20} collapsible>
      Panel 3
    </Panel>
  </PanelGroup>
);

export const collapsibleCode = `<PanelGroup>
  <Panel id="1" minSize={20} collapsible>
      Panel 1
  </Panel>
  <ResizeHandle />
  <Panel id="2" minSize={20}>
      Panel 2
  </Panel>
  <ResizeHandle />
  <Panel id="3" minSize={20} collapsible>
      Panel 3
  </Panel>
</PanelGroup>
`;
