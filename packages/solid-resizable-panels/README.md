# Solid-resizable-panels

A collection of components for building resizable panels.

https://solid-resizable-panels.vercel.app/

## Usage

```jsx
import {PanelGroup, Panel, ResizeHandle} from 'solid-resizable-panels';
// Don't forget to import styles!
import 'solid-resizable-panels/styles.css';

const TestApp = () => {
  return (
    <PanelGroup direction="row">
      <Panel
        id="1"
        collapsible
        minSize={20}
        onCollapse={() => console.log('collapsed')}
        onExpand={() => console.log('expanded')}
      >
        hi!
      </Panel>
      <ResizeHandle />
      <Panel id="2">hi 2!</Panel>
    </PanelGroup>
  );
};
```

## Options

### PanelGroup

```ts
export interface PanelGroupProps {
  /**
   * A flex-direction property applied to the element
   * @default "row"
   */
  direction?: Direction;
  /**
   * If the parent element has CSS zoom property
   * The zoom value should be passed to eliminate visual bugs during resizing
   * @default 1
   */
  zoom?: number;
  /**
   * If the parent element has CSS scale property
   * The scale value should be passed to eliminate visual bugs during resizing
   * @default 1
   */
  scale?: number;
  /**
   * Rendered HTML tag
   * @default "div"
   */
  tag?: string;
  /**
   * Extra class passed to panel DOM element.
   */
  class?: string;
  /**
   * A callback called during resize
   */
  onLayoutChange?: (sizes: number[]) => void;
  /**
   * You can pass custom resize algorithm and implemenent custom resize logic
   * This algorithm is called every time on items resize (mousemove or touchmove)
   * So it should return the final state of the items
   *
   * @returns The sizes of the items on the current resize event (mousemove or touchmove)
   */
  resizeAlgorithm?: (
    /** Current state of layout */
    resolvedLayout: {
      id: string;
      size: number;
      minSize: number;
      maxSize: number;
      collapsible: boolean;
    }[],
    /** Sizes on resize start */
    sizesOnResizeStart: number[],
    resizableItemIndex: number,
    /**
     * Delta size is computed from the initial size (before resize) and current state
     */
    deltaSize: number,
  ) => number[];
}
```

### Panel

```ts
export interface PanelProps {
  id: string;
  /**
   * Index of the panel within panel group.
   * Should be passed when conditional panels used.
   * @default undefined
   */
  index?: number;
  /**
   * Rendered HTML tag
   * @default "div"
   */
  tag?: string;
  /**
   * Initial size of the panel in percent.
   * @default computed according to layout
   */
  initialSize?: number;
  /**
   * Minimum size of the panel in percent.
   * @default 0
   */
  minSize?: number;
  /**
   * Maximum size of the panel in percent.
   * @default 100
   */
  maxSize?: number;
  /**
   * Is panel collapsible
   * @default false
   */
  collapsible?: boolean;
  /**
   * Extra class passed to panel DOM element.
   */
  class?: string;
  /** A callback called when the panel becomes collapsed */
  onCollapse?: VoidFunction;
  /** A callback called when the panel becomes expanded */
  onExpand?: VoidFunction;
  /** A callback called when size changes */
  onResize?: (newSize: number) => void;
}
```

### ResizeHandle

```ts
export interface ResizeHandleProps {
  /**
   * Disables the handle
   * @default false
   */
  disabled?: boolean;
  /**
   * Rendered HTML tag
   * @default "button"
   */
  tag?: string;
  /**
   * Extra class passed to panel DOM element.
   */
  class?: string;
}
```