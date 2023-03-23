import { createStore, produce } from "solid-js/store";
import { ConfigItem } from "../types";

interface Params {
  config: ConfigItem[];
}

export const createPanelStore = ({ config }: Params) => {
  const [state, setState] = createStore({ config }, { name: "PanelStore" });

  const setConfig = (newConfig: ConfigItem[]) =>
    setState({ config: newConfig });

  const onSizeChange = (deltaSize: number, handleAfterItemWithId: string) => {
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
          const newSize = currentItem.size + deltaSize;
          const minSize = currentItem.minSize ?? 0;
          const maxSize = currentItem.maxSize ?? Infinity;

          if (newSize < minSize) {
            if (currentItem.collapsible && !currentItem.collapsed) {
              currentItem.collapsed = true;
              break;
            } else continue;
          }

          if (newSize >= minSize && newSize <= maxSize) {
            currentItem.size = newSize;
            sizeChanged = true;
            break;
          }

          if (newSize > maxSize) continue;
        }

        if (sizeChanged) {
          for (let i = currentItemIndex; i >= 0; i--) {
            const currentItem = s.config[i];
            const newSize = currentItem.size - deltaSize;
            const minSize = currentItem.minSize ?? 0;
            const maxSize = currentItem.maxSize ?? Infinity;

            if (newSize < minSize) {
              if (currentItem.collapsible && !currentItem.collapsed) {
                currentItem.collapsed = true;
                break;
              } else continue;
            }

            if (newSize >= minSize && newSize <= maxSize) {
              currentItem.size = newSize;
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
    onSizeChange,
  };
};

export type SolidPanelStateAdapter = ReturnType<typeof createPanelStore>;
