import type { Component } from "solid-js";

import { SolidPanelGroup, createPanelStore } from "./lib";
import "./lib/styles.css";

import styles from "./App.module.css";

const App: Component = () => {
  return (
    <div class={styles.App}>
      <SolidPanelGroup
        {...createPanelStore({
          config: [
            { id: "1", size: 100, collapsible: false },
            { id: "2", size: 100 },
          ],
        })}
      >
        <div data-solid-panel-id="1">hi</div>
        <div data-solid-panel-id="2">2</div>
      </SolidPanelGroup>
    </div>
  );
};

export default App;
