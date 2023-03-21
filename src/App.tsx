import type { Component } from "solid-js";

import { SolidPanelGroup } from "./lib";

import styles from "./App.module.css";

const App: Component = () => {
  return (
    <div class={styles.App}>
      <SolidPanelGroup config={[{ id: "1", size: 100 }]}>
        <div data-solid-panel-id="1">hi</div>
      </SolidPanelGroup>
    </div>
  );
};

export default App;
