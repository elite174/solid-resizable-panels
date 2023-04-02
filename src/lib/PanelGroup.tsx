import {
  mergeProps,
  ParentComponent,
  createMemo,
  createSignal,
  createComputed,
} from "solid-js";
import { createStore, produce } from "solid-js/store";
import { Dynamic } from "solid-js/web";
import { TOTAL_FLEX_GROW } from "./constants";

import { useResize } from "./hooks/use-resize";
import { createPanelStore } from "./store";
import { Direction, LayoutItem, ResolvedLayoutItem } from "./types";

import { roundTo4Digits } from "./utils/math";
import { PanelContext } from "./context";
import { makeLogText } from "./utils/log";

interface PanelGroupProps {
  direction?: Direction;
  tag?: string;
  class?: string;
  reverse?: boolean;
  zoom?: number;
  scale?: number;
}

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

  const [containerRef, setContainerRef] = createSignal<
    HTMLElement | undefined
  >();

  const [initialState, setInitialState] = createStore<{
    layout: LayoutItem[];
  }>({
    layout: [],
  });

  const processedLayout = createMemo<ResolvedLayoutItem[]>(() => {
    let itemCountWithUndefinedSize = 0;
    let spentFlexGrow = 0;

    initialState.layout.forEach((item) => {
      if (item.size) spentFlexGrow += item.size;
      else itemCountWithUndefinedSize++;
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

      const errorMinSize = resolvedItem.size < resolvedItem.minSize;
      const errorMaxSize = resolvedItem.size > resolvedItem.maxSize;

      if (errorMinSize || errorMaxSize)
        console.warn(
          makeLogText(
            `Error. Item with id="${
              item.id
            }" has wrong size limitations: its size (${
              resolvedItem.size
            }%) is ${errorMinSize ? "less" : "more"} than ${
              errorMinSize ? "minimum" : "maximum"
            } size (${
              errorMinSize ? resolvedItem.minSize : resolvedItem.maxSize
            }%). `
          )
        );

      return resolvedItem;
    });
  });

  const { state, setConfig, onLayoutChange } = createPanelStore(
    processedLayout()
  );

  createComputed(() => {
    setConfig(processedLayout());
  });

  let lastRegisterPanelId = "";

  const registerPanel = (data: LayoutItem, index?: number) => {
    setInitialState(
      produce((s) => {
        if (index) {
          s.layout.splice(index, 0, data);
        } else {
          s.layout.push(data);
        }
      })
    );

    lastRegisterPanelId = data.id;
  };

  const unregisterPanel = (panelId: string) => {
    setInitialState(
      produce((s) => {
        s.layout = s.layout.filter((data) => data.id !== panelId);
      })
    );
  };

  const useData = (panelId: string) =>
    createMemo(() => state.layout.find((item) => item.id === panelId));

  const getHandleId = () => lastRegisterPanelId;

  const createMouseDownHandler = useResize({
    zoom: () => props.zoom,
    scale: () => props.scale,
    direction: () => props.direction,
    onSizeChange: onLayoutChange,
    state: () => state,
    reverse: () => props.reverse,
    containerRef,
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
        ref={setContainerRef}
        component={props.tag}
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
