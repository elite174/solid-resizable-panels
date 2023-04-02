import {
  ParentComponent,
  Show,
  createEffect,
  on,
  onCleanup,
  onMount,
  useContext,
} from "solid-js";
import { PanelContext } from "./context";
import { makeLogText } from "./utils/log";
import { SOLID_PANEL_ATTRIBUTE_NAME } from "./constants";

interface PanelProps {
  id: string;
  index?: number;
  size?: number;
  minSize?: number;
  maxSize?: number;
  collapsible?: boolean;
  onCollapse?: () => void;
  onExpand?: () => void;
}

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
    const panelId = props.id;

    context.registerPanel(
      {
        id: props.id,
        size: props.size,
        minSize: props.minSize,
        maxSize: props.maxSize,
        collapsible: props.collapsible,
      },
      props.index
    );

    onCleanup(() => context.unregisterPanel(panelId));
  });

  const data = context.useData(props.id);

  return (
    <Show when={data()} keyed>
      {(data) => {
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
          >
            {props.children}
          </div>
        );
      }}
    </Show>
  );
};
