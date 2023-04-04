import { PanelGroup as BasePanelGroup, Panel as BasePanel } from 'solid-resizable-panels';

export const PanelGroup: typeof BasePanelGroup = (props) => (
  <BasePanelGroup {...props} class="h-full w-full bg-[#444]">
    {props.children}
  </BasePanelGroup>
);

export const Panel: typeof BasePanel = (props) => (
  <BasePanel {...props} class="flex items-center justify-center" />
);
