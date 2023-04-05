import { render } from 'solid-js/web';

import '../styles.css';

import { PanelGroup } from '../PanelGroup';
import { Panel } from '../Panel';
import { ResizeHandle } from '../ResizeHandle';

import styles from './styles.module.css';

const TestApp = () => {
  return (
    <PanelGroup class={styles.debug} direction="row-reverse" onLayoutChange={console.log}>
      <Panel
        id="1"
        initialSize={30}
        collapsible
        onCollapse={() => console.log('collapsed')}
        onExpand={() => console.log('expanded')}
      >
        hi!
      </Panel>
      <ResizeHandle />
      <Panel id="2" onResize={(size) => console.log('resize', size)}>
        hi 2!
      </Panel>
    </PanelGroup>
  );
};

render(() => <TestApp />, document.getElementById('root')!);
