import Prism from 'prismjs';
import 'prismjs/themes/prism-dark.css';

import type { VoidComponent } from 'solid-js';

interface Props {
  text: string;
}

export const Highlighter: VoidComponent<Props> = (props) => {
  return (
    <pre class="bg-slate-900 p-2 rounded overflow-hidden">
      <code
        class="language-jsx"
        data-dependencies="jsx"
        innerHTML={Prism.highlight(props.text, Prism.languages.javascript, 'jsx')}
      ></code>
    </pre>
  );
};
