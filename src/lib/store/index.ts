import { createStore, produce, reconcile } from "solid-js/store";
import { ConfigItem } from "../types";

interface Params {
  config: ConfigItem[];
}

export const createPanelStore = ({ config }: Params) => {
  const [state, setState] = createStore({ config }, { name: "PanelStore" });

  const setConfig = (config: ConfigItem[]) =>
    setState("config", reconcile(config));

  const onLayoutChange = (
    deltaSize: number,
    handleAfterItemWithId: string,
    stateBeforeResize: { id: string; flexGrow: number }[]
  ) => {
    const currentItemIndex = state.config.findIndex(
      (item) => item.id === handleAfterItemWithId
    );

    // TODO handle error somehow
    if (currentItemIndex === -1) return;

    setState(
      produce((s) => {
        let sizeChanged = false;

        for (let i = currentItemIndex + 1; i < s.config.length; i++) {
          const currentItem = s.config[i];

          const newFlexGrow = stateBeforeResize[i].flexGrow - deltaSize;
          const minSize = currentItem.minFlexGrow ?? 0;
          const maxSize = currentItem.maxFlexGrow ?? Infinity;

          if (newFlexGrow < minSize) {
            if (currentItem.collapsible && !currentItem.collapsed) {
              currentItem.collapsed = true;
              break;
            } else continue;
          }

          if (newFlexGrow >= minSize && newFlexGrow <= maxSize) {
            currentItem.flexGrow = newFlexGrow;
            sizeChanged = true;
            break;
          }

          if (newFlexGrow > maxSize) continue;
        }

        if (sizeChanged) {
          for (let i = currentItemIndex; i >= 0; i--) {
            const currentItem = s.config[i];
            const newSize = stateBeforeResize[i].flexGrow + deltaSize;
            const minSize = currentItem.minFlexGrow ?? 0;
            const maxSize = currentItem.maxFlexGrow ?? Infinity;

            if (newSize < minSize) {
              if (currentItem.collapsible && !currentItem.collapsed) {
                currentItem.collapsed = true;
                break;
              } else continue;
            }

            if (newSize >= minSize && newSize <= maxSize) {
              currentItem.flexGrow = newSize;
              break;
            }

            if (newSize > maxSize) continue;
          }
        }
      })
    );
  };

  return {
    state,
    setConfig,
    onLayoutChange,
  };
};

export type SolidPanelStateAdapter = ReturnType<typeof createPanelStore>;
