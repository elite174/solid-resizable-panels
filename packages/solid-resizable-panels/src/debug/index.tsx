import { render } from 'solid-js/web';

import '../styles.css';

import { PanelGroup } from '../PanelGroup';
import { Panel } from '../Panel';
import { ResizeHandle } from '../ResizeHandle';

import styles from './styles.module.css';

const TestApp = () => {
  return (
    <PanelGroup class={styles.debug} direction="row">
      <Panel
        id="1"
        initialSize={30}
        minSize={20}
        collapsible
        onCollapse={() => console.log('collapsed')}
        onExpand={() => console.log('expanded')}
      >
        hi!
      </Panel>
      <ResizeHandle />
      <Panel id="2" minSize={20}>
        hi 2!
      </Panel>
      <ResizeHandle />
      <Panel id="3" minSize={20} collapsible>
        hi 3!
      </Panel>
    </PanelGroup>
  );
};

render(() => <TestApp />, document.getElementById('root')!);
