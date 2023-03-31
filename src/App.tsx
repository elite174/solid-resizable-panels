import type { Component } from "solid-js";

import { SolidPanelGroup, createPanelStore } from "./lib";
import "./lib/styles.css";

import styles from "./App.module.css";

const App: Component = () => {
  const { setConfig, ...adapter } = createPanelStore({
    config: [
      {
        id: "1",
        flexGrow: 100,
        minFlexGrow: 20,
        collapsible: true,
      },
      { id: "2", flexGrow: 100, minFlexGrow: 50 },
      { id: "3", flexGrow: 100, collapsible: true },
      { id: "4", flexGrow: 100, minFlexGrow: 50, maxFlexGrow: 110 },
    ],
  });

  /* setTimeout(() => {
    setConfig([
      { id: "1", flexGrow: 1, collapsible: false },
      { id: "2", flexGrow: 1 },
      { id: "3", flexGrow: 1 },
    ]);
  }, 5000); */

  return (
    <div class={styles.App}>
      <SolidPanelGroup {...adapter}>
        <div data-solid-panel-id="1">hi</div>
        <div data-solid-panel-id="2">2</div>
        <div data-solid-panel-id="3">3</div>
        <div data-solid-panel-id="4">4</div>
      </SolidPanelGroup>
    </div>
  );
};

export default App;
