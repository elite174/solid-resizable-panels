import {
  mergeProps,
  ParentComponent,
  children,
  For,
  createMemo,
  Show,
  createSignal,
  createContext,
  useContext,
  onMount,
  onCleanup,
  Accessor,
  Component,
} from "solid-js";
import { createStore, produce } from "solid-js/store";
import { Dynamic } from "solid-js/web";
import {
  SOLID_PANEL_ATTRIBUTE_NAME,
  SOLID_PANEL_HANDLE_ATTRIBUTE_NAME,
  TOTAL_FLEX_GROW,
} from "./constants";

import { useResize } from "./hooks/use-resize";
import { SolidPanelStateAdapter } from "./store";
import { Direction } from "./types";

import { makeLogText } from "./utils/log";
import { roundTo4Digits } from "./utils/math";

interface Props {
  direction?: Direction;
  tag?: string;
  class?: string;
  reverse?: boolean;
  zoom?: number;
  scale?: number;
  state: SolidPanelStateAdapter["state"];
  onLayoutChange: SolidPanelStateAdapter["onLayoutChange"];
  onCollapse?: (panelId: string) => void;
  onReveal?: (panelId: string) => void;
}

const NOOP = () => {};

type TODO = any;

interface PanelData extends TODO {}

interface PanelGroupProps {
  direction?: Direction;
  tag?: string;
  class?: string;
  reverse?: boolean;
  zoom?: number;
  scale?: number;
}

interface PanelProps {
  id: string;
  order?: number;
  size?: number;
  minSize?: number;
  maxSize?: number;
  collapsible?: boolean;
  onCollapse?: () => void;
  onExpand?: () => void;
}

interface ResolvedPanelData {
  id: string;
  size: number;
  minSize: number;
  maxSize: number;
  collapsible: boolean;
}

interface PanelData {
  id: string;
}

interface PanelContext {
  registerPanel: (panelData: PanelData, index?: number) => void;
  unregisterPanel: (panelId: string) => void;
  useData: (panelId: string) => Accessor<ResolvedPanelData | undefined>;
}

const PanelContext = createContext<PanelContext>({
  registerPanel: NOOP,
  unregisterPanel: NOOP,
  useData: NOOP as any,
} as PanelContext);

export const Panel: ParentComponent<PanelProps> = (props) => {
  const context = useContext(PanelContext);

  if (!context) {
    console.warn(
      makeLogText(
        `Error: Panel component must be rendered inside PanelGroup component`
      )
    );

    return null;
  }

  onMount(() => {
    context.registerPanel({ id: props.id }, props.order);
  });

  onCleanup(() => {
    context.unregisterPanel(props.id);
  });

  const data = context.useData(props.id);

  return (
    <Show when={data()} keyed>
      {(data) => {
        return (
          <div
            {...{ [SOLID_PANEL_ATTRIBUTE_NAME]: true }}
            style={{
              "flex-grow": data.size,
              "flex-shrink": 1,
              "flex-basis": "0px",
              overflow: "hidden",
            }}
          >
            {props.children}
          </div>
        );
      }}
    </Show>
  );
};

interface ResizeHandleProps {
  class?: string;
}

export const ResizeHandle: ParentComponent<ResizeHandleProps> = (props) => {
  const context = useContext(PanelContext);

  if (!context) {
    console.warn(
      makeLogText(
        `Error: Panel component must be rendered inside PanelGroup component`
      )
    );

    return null;
  }

  return (
    <button
      classList={{ "resize-handle": true, [props.class ?? ""]: true }}
      {...{ [SOLID_PANEL_HANDLE_ATTRIBUTE_NAME]: true }}
    >
      {props.children}
    </button>
  );
};

export const PanelGroup: ParentComponent<PanelGroupProps> = (initialProps) => {
  const props = mergeProps({ tag: "div" }, initialProps);

  const [state, setState] = createStore<{ layout: PanelData[] }>({
    layout: [],
  });

  const [container, setContainer] = createSignal<HTMLElement | undefined>(
    undefined
  );

  const processedLayout = createMemo(() => {
    let itemCountWithUndefinedSize = 0;
    let spentFlexGrow = 0;

    state.layout.forEach((item) => {
      if (item.size) spentFlexGrow += item.size;
      else if (!item.static) itemCountWithUndefinedSize++;
    });

    const remainingFlexGrowPerItem = roundTo4Digits(
      (TOTAL_FLEX_GROW - spentFlexGrow) / itemCountWithUndefinedSize
    );

    return state.layout.map((item) => {
      const resolvedItem = {
        id: item.id,
        size: item.size ?? remainingFlexGrowPerItem,
        minSize: item.minSize ?? 0,
        maxSize: item.maxSize ?? Infinity,
        collapsible: Boolean(item.collapsible),
      };

      return resolvedItem;
    });
  });

  const registerPanel = (data: PanelData, index?: number) => {
    setState(
      produce((s) => {
        if (index) {
          s.layout.splice(index, 0, data);
        } else {
          s.layout.push(data);
        }
      })
    );
  };

  const unregisterPanel = (panelId: string) => {
    setState(
      produce((s) => {
        s.layout = s.layout.filter((data) => data.id === panelId);
      })
    );
  };

  const useData = (panelId: string) =>
    createMemo(() => processedLayout().find((item) => item.id === panelId));

  return (
    <PanelContext.Provider value={{ registerPanel, unregisterPanel, useData }}>
      <Dynamic
        component={props.tag}
        ref={setContainer}
        classList={{
          ["solid-panel"]: true,
          ["solid-panel_vertical"]: props.direction === "vertical",
          ["solid-panel_reverse"]: Boolean(props.reverse),
          [props.class ?? ""]: true,
        }}
      >
        {props.children}
      </Dynamic>
    </PanelContext.Provider>
  );
};

export const SolidPanelGroup: ParentComponent<Props> = (initialProps) => {
  const props = mergeProps(
    {
      tag: "div",
      zoom: 1,
      scale: 1,
      direction: "horizontal" as Direction,
      reverse: false,
    },
    initialProps
  );

  const [container, setContainer] = createSignal<HTMLElement | undefined>(
    undefined
  );

  const resolvedChildren = createMemo<Element[]>(() => {
    const resolvedChildrenArray = children(() => props.children).toArray();

    const validChildren = [];

    for (let i = 0; i < resolvedChildrenArray.length; i++) {
      const currentChild = resolvedChildrenArray[i];
      if (
        currentChild instanceof Element &&
        currentChild.hasAttribute(SOLID_PANEL_ATTRIBUTE_NAME)
      )
        validChildren.push(currentChild);
      else
        console.warn(
          makeLogText(
            `The child ${currentChild} is not a valid child element. It should be an HTMLElement and should have data-grid-id attribute.`
          )
        );
    }

    return validChildren;
  });

  const createMouseDownHandler = useResize({
    zoom: () => props.zoom,
    scale: () => props.scale,
    direction: () => props.direction,
    onSizeChange: props.onLayoutChange,
    state: () => props.state,
    container,
    reverse: () => props.reverse,
  });

  return (
    <Dynamic
      component={props.tag}
      ref={setContainer}
      classList={{
        ["solid-panel"]: true,
        ["solid-panel_vertical"]: props.direction === "vertical",
        ["solid-panel_reverse"]: Boolean(props.reverse),
        [props.class ?? ""]: true,
      }}
    >
      <For each={props.state.layout}>
        {(item, index) => {
          const child = () =>
            resolvedChildren().find(
              (element) =>
                element.getAttribute(SOLID_PANEL_ATTRIBUTE_NAME) === item.id
            );

          return (
            <Show when={child()}>
              {(content) => {
                const isLast = () => index() === props.state.layout.length - 1;

                const isResizeHandleVisible = () => item.static && !isLast();

                const itemStyle = () =>
                  item.static
                    ? {
                        "flex-grow": 0,
                        "flex-shrink": 0,
                      }
                    : {
                        "flex-grow": item.size,
                        "flex-shrink": 1,
                        "flex-basis": "0px",
                        overflow: "hidden",
                      };

                return (
                  <>
                    <div
                      {...{ [SOLID_PANEL_ATTRIBUTE_NAME]: true }}
                      style={itemStyle()}
                    >
                      {content()}
                    </div>
                    <Show when={isResizeHandleVisible()}>
                      <button
                        {...{ [SOLID_PANEL_HANDLE_ATTRIBUTE_NAME]: true }}
                        class="resize-handle"
                        onMouseDown={createMouseDownHandler(item.id)}
                      ></button>
                    </Show>
                  </>
                );
              }}
            </Show>
          );
        }}
      </For>
    </Dynamic>
  );
};
