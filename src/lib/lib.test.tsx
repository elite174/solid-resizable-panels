import { describe, test, vi } from "vitest";
import { render } from "@solidjs/testing-library";

import { Panel, PanelGroup, ResizeHandle } from ".";

describe.concurrent("Lib tests", () => {
  test("panels without config should have equal sizes", async ({ expect }) => {
    const { findAllByText } = render(() => (
      <PanelGroup>
        <Panel id="1">1</Panel>
        <ResizeHandle />
        <Panel id="2">1</Panel>
        <ResizeHandle />
        <Panel id="3">1</Panel>
      </PanelGroup>
    ));

    const items = await findAllByText("1");

    expect(new Set(items.map((item) => item.getBoundingClientRect().width)).size).toBe(1);
  });

  test("onLayoutChange callback should not be called on initial render", async ({ expect }) => {
    const onLayoutChange = vi.fn();

    render(() => (
      <PanelGroup onLayoutChange={onLayoutChange}>
        <Panel id="1">1</Panel>
        <ResizeHandle />
        <Panel id="2">1</Panel>
        <ResizeHandle />
        <Panel id="3">1</Panel>
      </PanelGroup>
    ));

    expect(onLayoutChange).not.toHaveBeenCalled();
  });

  test("onCollapse callback should not be called on initial render when panel size is 0", async ({ expect }) => {
    const onCollapse = vi.fn();

    render(() => (
      <PanelGroup>
        <Panel id="1" initialSize={0} onCollapse={onCollapse}>
          1
        </Panel>
        <ResizeHandle />
        <Panel id="2">1</Panel>
        <ResizeHandle />
        <Panel id="3">1</Panel>
      </PanelGroup>
    ));

    expect(onCollapse).not.toHaveBeenCalled();
  });

  test("onExpand callback should not be called on initial render", async ({ expect }) => {
    const onExpand = vi.fn();

    render(() => (
      <PanelGroup>
        <Panel id="1" onExpand={onExpand}>
          1
        </Panel>
        <ResizeHandle />
        <Panel id="2">1</Panel>
        <ResizeHandle />
        <Panel id="3">1</Panel>
      </PanelGroup>
    ));

    expect(onExpand).not.toHaveBeenCalled();
  });
});
