import {
  mergeProps,
  ParentComponent,
  createMemo,
  Show,
  createSignal,
  createContext,
  useContext,
  onMount,
  onCleanup,
  Accessor,
  createEffect,
  on,
  createComputed,
} from "solid-js";
import { createStore, produce } from "solid-js/store";
import { Dynamic } from "solid-js/web";
import {
  SOLID_PANEL_ATTRIBUTE_NAME,
  SOLID_PANEL_HANDLE_ATTRIBUTE_NAME,
  TOTAL_FLEX_GROW,
} from "./constants";

import { useResize } from "./hooks/use-resize";
import { createPanelStore } from "./store";
import { Direction } from "./types";

import { makeLogText } from "./utils/log";
import { roundTo4Digits } from "./utils/math";

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
  size?: number;
  minSize?: number;
  maxSize?: number;
  collapsible?: number;
  container: Accessor<HTMLElement | undefined>;
}

interface PanelContext {
  registerPanel: (panelData: PanelData, index?: number) => void;
  unregisterPanel: (panelId: string) => void;
  useData: (panelId: string) => Accessor<ResolvedPanelData | undefined>;
  createMouseDownHandler: (
    panelId: Accessor<string>
  ) => (e: MouseEvent) => void;
  getHandleId: () => string;
}

const PanelContext = createContext<PanelContext>({
  registerPanel: NOOP,
  unregisterPanel: NOOP,
  useData: NOOP as any,
  createMouseDownHandler: () => NOOP,
  getHandleId: NOOP as any,
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

  const [container, setContainer] = createSignal<HTMLElement | undefined>(
    undefined
  );

  onMount(() => {
    context.registerPanel({ id: props.id, container }, props.order);
  });

  onCleanup(() => {
    context.unregisterPanel(props.id);
  });

  const data = context.useData(props.id);

  return (
    <Show when={data()} keyed>
      {(data) => {
        console.log("data");
        createEffect(
          on(
            () => props.collapsible,
            (isCollapsible) => {
              if (isCollapsible) {
                createEffect(
                  on(
                    () => data.size,
                    (size, prevSize) => {
                      if (size === 0 && prevSize !== 0) props.onCollapse?.();

                      return size;
                    },
                    { defer: true }
                  ),
                  data.size
                );

                createEffect(
                  on(
                    () => data.size,
                    (size, prevSize) => {
                      if (size !== 0 && prevSize === 0) props.onExpand?.();

                      return size;
                    },
                    { defer: true }
                  ),
                  data.size
                );
              }
            }
          )
        );

        return (
          <div
            {...{ [SOLID_PANEL_ATTRIBUTE_NAME]: true }}
            style={{
              "flex-grow": data.size,
              "flex-shrink": 1,
              "flex-basis": "0px",
              overflow: "hidden",
            }}
            ref={setContainer}
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

  let panelId = "";

  onMount(() => {
    panelId = context.getHandleId();
  });

  return (
    <button
      classList={{ "resize-handle": true, [props.class ?? ""]: true }}
      {...{ [SOLID_PANEL_HANDLE_ATTRIBUTE_NAME]: true }}
      onMouseDown={context.createMouseDownHandler(() => panelId)}
    >
      {props.children}
    </button>
  );
};

export const PanelGroup: ParentComponent<PanelGroupProps> = (initialProps) => {
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

  const [initialState, setInitialState] = createStore<{ layout: PanelData[] }>({
    layout: [],
  });

  const [container, setContainer] = createSignal<HTMLElement | undefined>(
    undefined
  );

  const processedLayout = createMemo(() => {
    let itemCountWithUndefinedSize = 0;
    let spentFlexGrow = 0;

    initialState.layout.forEach((item) => {
      if (item.size) spentFlexGrow += item.size;
      else if (!item.static) itemCountWithUndefinedSize++;
    });

    const remainingFlexGrowPerItem = roundTo4Digits(
      (TOTAL_FLEX_GROW - spentFlexGrow) / itemCountWithUndefinedSize
    );

    return initialState.layout.map((item) => {
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

  const { state, setConfig, onLayoutChange } = createPanelStore({
    layout: processedLayout(),
  });

  createComputed(() => {
    setConfig(processedLayout());
  });

  const registerPanel = (data: PanelData, index?: number) => {
    setInitialState(
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
    setInitialState(
      produce((s) => {
        s.layout = s.layout.filter((data) => data.id === panelId);
      })
    );
  };

  const useData = (panelId: string) =>
    createMemo(() => state.layout.find((item) => item.id === panelId));

  const getHandleId = () => initialState.layout.at(-1)?.id ?? "";

  const createMouseDownHandler = useResize({
    zoom: () => props.zoom,
    scale: () => props.scale,
    direction: () => props.direction,
    onSizeChange: onLayoutChange,
    state: () => state,
    container,
    reverse: () => props.reverse,
  });

  return (
    <PanelContext.Provider
      value={{
        registerPanel,
        unregisterPanel,
        useData,
        createMouseDownHandler,
        getHandleId,
      }}
    >
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
