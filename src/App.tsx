import type { Component } from "solid-js";

import { SolidPanelGroup, createPanelStore } from "./lib";
import "./lib/styles.css";

import styles from "./App.module.css";

const App: Component = () => {
  const { setConfig, ...adapter } = createPanelStore({
    layout: [
      {
        id: "1",
        minSize: 20,
        collapsible: true,
      },
      { id: "2", minSize: 5, collapsible: true },
      { id: "3", static: true },
      {
        id: "4",
        minSize: 5,
        maxSize: 80,
        collapsible: true,
      },
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
    <SolidPanelGroup {...adapter} class={styles.panelGroup}>
      <div data-solid-panel-id="1">hi</div>
      <div data-solid-panel-id="2">2</div>
      <div data-solid-panel-id="3">3</div>
      <div data-solid-panel-id="4">4</div>
    </SolidPanelGroup>
  );
};

export default App;
