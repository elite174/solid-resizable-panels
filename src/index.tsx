import { Dynamic, render } from "solid-js/web";
import { type VoidComponent, For, type ParentComponent, createSignal, batch } from "solid-js";

//import { PanelGroup, PanelGroupAPI, Panel, ResizeHandle } from "solid-resizable-panels";

import { PanelGroup, type PanelGroupAPI, Panel, ResizeHandle } from "./lib";

import "./lib/styles.css";
import "./styles.css";

const DEBUG = true;

const CodeExample: VoidComponent<{ ExampleComponent: VoidComponent; code: string }> = (props) => (
  <>
    <Dynamic component={props.ExampleComponent} />
    <h3>Code</h3>
    <pre>
      <code class="language-tsx">{props.code}</code>
    </pre>
  </>
);

const Section: ParentComponent<{ title: string; slug: string }> = (props) => (
  <>
    <h2 id={props.slug}>
      <a href={`#${props.slug}`}>{props.title}</a>
    </h2>
    {props.children}
  </>
);

const EXAMPLES: { ExampleComponent: VoidComponent; title: string; slug: string }[] = DEBUG
  ? [
      {
        title: "DEBUG example",
        slug: "debug",
        ExampleComponent: () => (
          <CodeExample
            ExampleComponent={() => (
              <PanelGroup>
                <Panel id="1">Panel 1</Panel>
                <ResizeHandle />
                <Panel id="2">Panel 2</Panel>
                <ResizeHandle />
                <Panel id="3">Panel 3</Panel>
              </PanelGroup>
            )}
            code={String.raw`<PanelGroup>
<Panel id="1">Panel 1</Panel>
<ResizeHandle />
<Panel id="2">Panel 2</Panel>
<ResizeHandle />
<Panel id="3">Panel 3</Panel>
</PanelGroup>`}
          />
        ),
      },
    ]
  : [
      {
        title: "Basic example",
        slug: "basic",
        ExampleComponent: () => (
          <CodeExample
            ExampleComponent={() => (
              <PanelGroup>
                <Panel id="1">Panel 1</Panel>
                <ResizeHandle />
                <Panel id="2">Panel 2</Panel>
                <ResizeHandle />
                <Panel id="3">Panel 3</Panel>
              </PanelGroup>
            )}
            code={String.raw`<PanelGroup>
  <Panel id="1">Panel 1</Panel>
  <ResizeHandle />
  <Panel id="2">Panel 2</Panel>
  <ResizeHandle />
  <Panel id="3">Panel 3</Panel>
</PanelGroup>`}
          />
        ),
      },
      {
        title: "Vertical layout",
        slug: "vertical-layout",
        ExampleComponent: () => (
          <CodeExample
            ExampleComponent={() => (
              <PanelGroup direction="column">
                <Panel id="1">Panel 1</Panel>
                <ResizeHandle />
                <Panel id="2">Panel 2</Panel>
                <ResizeHandle />
                <Panel id="3">Panel 3</Panel>
              </PanelGroup>
            )}
            code={String.raw`<PanelGroup direction="column">
  <Panel id="1">Panel 1</Panel>
  <ResizeHandle />
  <Panel id="2">Panel 2</Panel>
  <ResizeHandle />
  <Panel id="3">Panel 3</Panel>
</PanelGroup>`}
          />
        ),
      },
      {
        title: "Min and max size",
        slug: "min-max-size",
        ExampleComponent: () => (
          <CodeExample
            ExampleComponent={() => (
              <PanelGroup>
                <Panel id="1" initialSize={30} minSize={20} maxSize={30}>
                  Panel 1
                </Panel>
                <ResizeHandle />
                <Panel id="2" minSize={20} maxSize={70}>
                  Panel 2
                </Panel>
                <ResizeHandle />
                <Panel id="3" minSize={20}>
                  Panel 3
                </Panel>
              </PanelGroup>
            )}
            code={String.raw`<PanelGroup>
  <Panel id="1" initialSize={30} minSize={20} maxSize={30}>
    Panel 1
  </Panel>
  <ResizeHandle />
  <Panel id="2" minSize={20} maxSize={70}>
    Panel 2
  </Panel>
  <ResizeHandle />
  <Panel id="3" minSize={20}>
    Panel 3
  </Panel>
</PanelGroup>`}
          />
        ),
      },
      {
        title: "Nested layout",
        slug: "nested-layout",
        ExampleComponent: () => (
          <CodeExample
            ExampleComponent={() => (
              <PanelGroup direction="column">
                <Panel id="1">Panel 1</Panel>
                <ResizeHandle />
                <Panel id="2">
                  <PanelGroup>
                    <Panel id="1">Panel 1</Panel>
                    <ResizeHandle />
                    <Panel id="2">Panel 2</Panel>
                    <ResizeHandle />
                    <Panel id="3">Panel 3</Panel>
                  </PanelGroup>
                </Panel>
                <ResizeHandle />
                <Panel id="3">Panel 3</Panel>
              </PanelGroup>
            )}
            code={String.raw`<PanelGroup direction="column">
  <Panel id="1">Panel 1</Panel>
  <ResizeHandle />
  <Panel id="2">
    <PanelGroup>
      <Panel id="1">Panel 1</Panel>
      <ResizeHandle />
      <Panel id="2">Panel 2</Panel>
      <ResizeHandle />
      <Panel id="3">Panel 3</Panel>
    </PanelGroup>
  </Panel>
  <ResizeHandle />
  <Panel id="3">Panel 3</Panel>
</PanelGroup>`}
          />
        ),
      },
      {
        title: "Collapsible panels",
        slug: "collapsible-panels",
        ExampleComponent: () => (
          <CodeExample
            ExampleComponent={() => (
              <PanelGroup>
                <Panel id="1" minSize={20} collapsible>
                  Panel 1
                </Panel>
                <ResizeHandle />
                <Panel id="2" minSize={20}>
                  Panel 2
                </Panel>
                <ResizeHandle />
                <Panel id="3" minSize={20} collapsible>
                  Panel 3
                </Panel>
              </PanelGroup>
            )}
            code={String.raw`<PanelGroup>
  <Panel id="1" minSize={20} collapsible>
    Panel 1
  </Panel>
  <ResizeHandle />
  <Panel id="2" minSize={20}>
    Panel 2
  </Panel>
  <ResizeHandle />
  <Panel id="3" minSize={20} collapsible>
    Panel 3
  </Panel>
</PanelGroup>`}
          />
        ),
      },
      {
        title: "Imperative API",
        slug: "imperative-api",
        ExampleComponent: () => (
          <CodeExample
            ExampleComponent={() => {
              const [api, setAPI] = createSignal<PanelGroupAPI>();

              const [isPanelCollapsed, setPanelCollapsed] = createSignal(false);
              const [isPanelExpanded, setPanelExpanded] = createSignal(false);

              return (
                <div>
                  <button disabled={isPanelCollapsed()} onClick={() => api()?.collapse("1")}>
                    Collapse panel 1
                  </button>
                  <button disabled={isPanelExpanded()} onClick={() => api()?.expand("1", 20)}>
                    Expand panel by 20%
                  </button>
                  <button onClick={() => api()?.setLayout([20, 20, 60])}>Set layout</button>
                  <PanelGroup
                    setAPI={setAPI}
                    logger={console}
                    onLayoutChange={(layout) =>
                      batch(() => {
                        setPanelCollapsed(layout[0] === 0);
                        setPanelExpanded(layout[0] !== 0);
                      })
                    }
                  >
                    <Panel id="1" collapsible minSize={20}>
                      Panel 1
                    </Panel>
                    <ResizeHandle />
                    <Panel id="2" minSize={20}>
                      Panel 2
                    </Panel>
                    <ResizeHandle />
                    <Panel id="3" minSize={20} collapsible>
                      Panel 3
                    </Panel>
                  </PanelGroup>
                </div>
              );
            }}
            code={String.raw`const [api, setAPI] = createSignal<PanelGroupAPI>();

const [isPanelCollapsed, setPanelCollapsed] = createSignal(false);
const [isPanelExpanded, setPanelExpanded] = createSignal(false);

return (
  <div>
    <button disabled={isPanelCollapsed()} onClick={() => api()?.collapse("1")}>
      Collapse panel 1
    </button>
    <button disabled={isPanelExpanded()} onClick={() => api()?.expand("1", 20)}>
      Expand panel by 20%
    </button>
    <button onClick={() => api()?.setLayout([20, 20, 60])}>Set layout</button>
    <PanelGroup
      setAPI={setAPI}
      logger={console}
      onLayoutChange={(layout) =>
        batch(() => {
          setPanelCollapsed(layout[0] === 0);
          setPanelExpanded(layout[0] !== 0);
        })
      }
    >
      <Panel id="1" collapsible minSize={20}>
        Panel 1
      </Panel>
      <ResizeHandle />
      <Panel id="2" minSize={20}>
        Panel 2
      </Panel>
      <ResizeHandle />
      <Panel id="3" minSize={20} collapsible>
        Panel 3
      </Panel>
    </PanelGroup>
  </div>
);`}
          />
        ),
      },
    ];

const App = () => (
  <main>
    <h1>solid-resizable-panels</h1>
    <p>A set of components for Solid.JS to make resizable layouts.</p>
    <h2>Contents</h2>
    <ol>
      <For each={EXAMPLES}>
        {(example) => (
          <li>
            <h3>
              <a href={`#${example.slug}`}>{example.title}</a>
            </h3>
          </li>
        )}
      </For>
    </ol>
    <For each={EXAMPLES}>
      {(example) => (
        <>
          <Section title={example.title} slug={example.slug}>
            <Dynamic component={example.ExampleComponent} />
          </Section>
        </>
      )}
    </For>
  </main>
);

render(() => <App />, document.getElementById("root")!);
