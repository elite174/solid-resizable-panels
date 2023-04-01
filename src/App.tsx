import type { Component } from "solid-js";

import { Panel, PanelGroup, ResizeHandle } from "./lib";
import "./lib/styles.css";

import styles from "./App.module.css";

const App: Component = () => {
  /*  const { setConfig, ...adapter } = createPanelStore({
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
  }); */

  /* setTimeout(() => {
    setConfig([
      { id: "1", flexGrow: 1, collapsible: false },
      { id: "2", flexGrow: 1 },
      { id: "3", flexGrow: 1 },
    ]);
  }, 5000); */

  return (
    <PanelGroup>
      <Panel id="1">
        <div>1</div>
      </Panel>
      <ResizeHandle />
      <Panel id="2">
        <div>2</div>
      </Panel>
      <Panel id="3">
        <div>3</div>
      </Panel>
    </PanelGroup>
  );
};

export default App;
