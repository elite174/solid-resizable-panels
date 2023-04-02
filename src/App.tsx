import type { Component } from "solid-js";

import { Panel, PanelGroup, ResizeHandle } from "./lib";
import "./lib/styles.css";

import styles from "./App.module.css";

const App: Component = () => {
  return (
    <PanelGroup class={styles.panelGroup}>
      <Panel id="1">
        <div>1</div>
      </Panel>
      <ResizeHandle />
      <Panel
        id="2"
        collapsible
        onCollapse={() => console.log("collapse")}
        onExpand={() => console.log("expand")}
      >
        <div>2</div>
      </Panel>
      <ResizeHandle />
      <Panel id="3">
        <div>3</div>
      </Panel>
    </PanelGroup>
  );
};

export default App;
