import { Component, Show, createSignal } from "solid-js";

import { Panel, PanelGroup, ResizeHandle } from "./lib";
import "./lib/styles.css";

import styles from "./App.module.css";

const App: Component = () => {
  const [visible, setVisible] = createSignal(true);

  return (
    <>
      <button onClick={() => setVisible((v) => !v)}>toggle</button>
      <PanelGroup class={styles.panelGroup}>
        <Panel id="1" index={0}>
          <div>1</div>
        </Panel>
        <ResizeHandle />
        <Show when={visible()}>
          <Panel
            id="2"
            collapsible
            index={1}
            minSize={20}
            onCollapse={() => console.log("collapse")}
            onExpand={() => console.log("expand")}
          >
            <div>2</div>
          </Panel>
          <ResizeHandle />
        </Show>
        <Panel id="3" index={2}>
          <div>3</div>
        </Panel>
      </PanelGroup>
    </>
  );
};

export default App;
