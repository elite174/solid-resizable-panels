import { Dynamic } from 'solid-js/web';

import type { VoidComponent } from 'solid-js';

import { Collapsible, collapsibleCode } from './Collapsible';
import { Vertical, verticalCode } from './Vertical';
import { Horizontal, horizontalCode } from './Horizontal';
import { Nested, nestedCode } from './Nested';

const examples = {
  collapsible: Collapsible,
  vertical: Vertical,
  horizontal: Horizontal,
  nested: Nested,
};

export type Example = keyof typeof examples;

const withImports = (
  code: string,
) => `import {PanelGroup, Panel, ResizeHandle} from 'solid-resizable-panels;
import 'solid-resizable-panels/styles.css';

${code}`;

export const codeMap: Record<Example, string> = {
  collapsible: withImports(collapsibleCode),
  horizontal: withImports(horizontalCode),
  nested: withImports(nestedCode),
  vertical: withImports(verticalCode),
};

interface Props {
  example: Example;
}

export const Examples: VoidComponent<Props> = (props) => (
  <Dynamic component={examples[props.example]} />
);
