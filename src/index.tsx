import { Dynamic, render } from "solid-js/web";
import { Show, VoidComponent, createSignal } from "solid-js";

import { PanelGroup, PanelGroupAPI } from "./lib/PanelGroup";
import { Panel } from "./lib/Panel";
import { ResizeHandle } from "./lib/ResizeHandle";

import "./lib/styles.css";
import './styles.css';

const ExampleSection: VoidComponent<{ title: string; ExampleComponent: VoidComponent; code: string }> = (props) => {
  return (
    <>
      <h2>{props.title}</h2>
      <Dynamic component={props.ExampleComponent} />
      <h3>Code</h3>
      <code>
        <pre>{props.code}</pre>
      </code>
    </>
  );
};

const App = () => {
  const [api, setAPI] = createSignal<PanelGroupAPI>();
  const [isPanelVisible, setPanelVisible] = createSignal(true);

  return (
    <main>
      <h1>solid-resizable-panels</h1>
      <ExampleSection
        title="Basic example"
        ExampleComponent={() => (
          <PanelGroup>
            <Panel id="1" initialSize={30} minSize={20} maxSize={30} collapsible>
              Panel 1
            </Panel>
            <ResizeHandle />
            <Panel id="2" minSize={20} maxSize={70} collapsible>
              Panel 2
            </Panel>
            <ResizeHandle />
            <Panel id="3" minSize={20} collapsible>
              Panel 3
            </Panel>
          </PanelGroup>
        )}
        code={String.raw`<PanelGroup>
        <Panel id="1" initialSize={30} minSize={20} maxSize={30} collapsible>
          Panel 1
        </Panel>
        <ResizeHandle />
        <Panel id="2" minSize={20} maxSize={70} collapsible>
          Panel 2
        </Panel>
        <ResizeHandle />
        <Panel id="3" minSize={20} collapsible>
          Panel 3
        </Panel>
      </PanelGroup>`}
      />
      <button onClick={() => api()?.setLayout([36, 30, 40])}>Call api</button>
      <button onClick={() => setPanelVisible((visible) => !visible)}>Toggle panel</button>
      <form
        onSubmit={(e) => {
          e.preventDefault();

          // @ts-ignore
          api()?.collapse(e.target["panel-id"].value);
        }}
      >
        <fieldset>
          <label>
            Panel id to collapse
            <input type="text" name="panel-id" />
          </label>
          <button>Collapse</button>
        </fieldset>
      </form>

      <form
        onSubmit={(e) => {
          e.preventDefault();

          // @ts-ignore
          api()?.expand(e.target["panel-id"].value);
        }}
      >
        <fieldset>
          <label>
            Panel id to expand
            <input type="text" name="panel-id" />
          </label>
          <button>Expand</button>
        </fieldset>
      </form>

      <PanelGroup direction="row" setAPI={setAPI} logger={console} onLayoutChange={console.log}>
        <Panel
          id="1"
          initialSize={30}
          minSize={20}
          maxSize={30}
          collapsible
          onCollapse={() => console.log("collapsed")}
          onExpand={() => console.log("expanded")}
        >
          hi!
        </Panel>
        <ResizeHandle />
        <Show when={isPanelVisible()}>
          <Panel id="2" minSize={20} maxSize={70} collapsible>
            hi 2!
          </Panel>
          <ResizeHandle />
        </Show>
        <Panel id="3" minSize={20} collapsible>
          hi 3!
        </Panel>
      </PanelGroup>
    </main>
  );
};

render(() => <App />, document.getElementById("root")!);
