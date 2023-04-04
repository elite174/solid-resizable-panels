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

export const codeMap: Record<Example, string> = {
  collapsible: collapsibleCode,
  horizontal: horizontalCode,
  nested: nestedCode,
  vertical: verticalCode,
};

interface Props {
  example: Example;
}

export const Examples: VoidComponent<Props> = (props) => (
  <Dynamic component={examples[props.example]} />
);
