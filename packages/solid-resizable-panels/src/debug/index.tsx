import { render } from 'solid-js/web';

import '../styles.css';

import { PanelGroup, PanelGroupAPI } from '../PanelGroup';
import { Panel } from '../Panel';
import { ResizeHandle } from '../ResizeHandle';

import styles from './styles.module.css';
import { createSignal } from 'solid-js';

const TestApp = () => {
  const [api, setAPI] = createSignal<PanelGroupAPI>();

  return (
    <>
      <button onClick={() => api()?.setLayout([36, 30, 40])}>Call api</button>
      <PanelGroup
        class={styles.debug}
        direction="row"
        setAPI={setAPI}
        logger={console}
        onLayoutChange={console.log}
      >
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
        <Panel id="2" minSize={20} maxSize={70} collapsible>
          hi 2!
        </Panel>
        <ResizeHandle />
        <Panel id="3" minSize={20} collapsible>
          hi 3!
        </Panel>
      </PanelGroup>
    </>
  );
};

render(() => <TestApp />, document.getElementById('root')!);
