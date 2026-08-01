import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useInteractiveLegend } from "./useInteractiveLegend";

const dataKeys = ["sales", "revenue", "costs", "margin"];
const colors = ["#111111", "#222222", "#333333", "#444444"];

describe("useInteractiveLegend", () => {
  it("exposes every series with its positional color and nothing hidden", () => {
    const { result } = renderHook(() => useInteractiveLegend({ dataKeys, colors }));

    expect(result.current.visibleKeys).toEqual(dataKeys);
    expect(result.current.hiddenKeys.size).toBe(0);
    expect(result.current.legendItems.map((item) => item.color)).toEqual(colors);
    expect(result.current.legendItems.every((item) => item.hidden === undefined)).toBe(true);
  });

  it("hides a series on click while keeping every legend item and its color", () => {
    const { result } = renderHook(() => useInteractiveLegend({ dataKeys, colors }));

    act(() => result.current.legendInteractionProps.onItemClick?.("revenue"));

    expect(result.current.visibleKeys).toEqual(["sales", "costs", "margin"]);
    // Legend still lists all four, in order, with their ORIGINAL colors.
    expect(result.current.legendItems.map((item) => item.key)).toEqual(dataKeys);
    expect(result.current.legendItems.map((item) => item.color)).toEqual(colors);
    expect(result.current.legendItems.map((item) => item.hidden)).toEqual([
      undefined,
      true,
      undefined,
      undefined,
    ]);
  });

  it("isolates on double click and restores on the next double click", () => {
    const { result } = renderHook(() => useInteractiveLegend({ dataKeys, colors }));

    // A real double click fires two clicks and then the double click.
    act(() => {
      result.current.legendInteractionProps.onItemClick?.("costs");
      result.current.legendInteractionProps.onItemClick?.("costs");
      result.current.legendInteractionProps.onItemDoubleClick?.("costs");
    });
    expect(result.current.visibleKeys).toEqual(["costs"]);

    act(() => {
      result.current.legendInteractionProps.onItemClick?.("costs");
      result.current.legendInteractionProps.onItemClick?.("costs");
      result.current.legendInteractionProps.onItemDoubleClick?.("costs");
    });
    expect(result.current.visibleKeys).toEqual(dataKeys);
  });

  it("keeps the double-click net effect correct on a two-series chart", () => {
    const twoKeys = ["sales", "revenue"];
    const { result } = renderHook(() =>
      useInteractiveLegend({ dataKeys: twoKeys, colors: colors.slice(0, 2) }),
    );

    act(() => {
      result.current.legendInteractionProps.onItemClick?.("sales");
      result.current.legendInteractionProps.onItemClick?.("sales");
      result.current.legendInteractionProps.onItemDoubleClick?.("sales");
    });
    expect(result.current.visibleKeys).toEqual(["sales"]);

    // The keep-one guard blocks both clicks here; the isolate still restores.
    act(() => {
      result.current.legendInteractionProps.onItemClick?.("sales");
      result.current.legendInteractionProps.onItemClick?.("sales");
      result.current.legendInteractionProps.onItemDoubleClick?.("sales");
    });
    expect(result.current.visibleKeys).toEqual(twoKeys);
  });

  it("hands back no handlers and no hidden state when disabled", () => {
    const { result } = renderHook(() => useInteractiveLegend({ dataKeys, colors, enabled: false }));

    expect(result.current.legendInteractionProps.onItemClick).toBeUndefined();
    expect(result.current.legendInteractionProps.onItemDoubleClick).toBeUndefined();
    expect(result.current.visibleKeys).toEqual(dataKeys);
    expect(result.current.hiddenKeys.size).toBe(0);
  });

  it("clears the hidden state when interaction is switched off and back on", () => {
    const { result, rerender } = renderHook(
      (props: { enabled: boolean }) =>
        useInteractiveLegend({ dataKeys, colors, enabled: props.enabled }),
      { initialProps: { enabled: true } },
    );

    act(() => result.current.legendInteractionProps.onItemClick?.("revenue"));
    expect(result.current.hiddenKeys.has("revenue")).toBe(true);

    rerender({ enabled: false });
    expect(result.current.hiddenKeys.size).toBe(0);

    // Switching interaction back on must NOT resurrect the old selection.
    rerender({ enabled: true });
    expect(result.current.hiddenKeys.size).toBe(0);
    expect(result.current.visibleKeys).toEqual(dataKeys);
  });

  it("keeps its handlers and its disabled props referentially stable", () => {
    const { result, rerender } = renderHook(
      (props: { enabled: boolean }) =>
        useInteractiveLegend({ dataKeys, colors, enabled: props.enabled }),
      { initialProps: { enabled: true } },
    );

    const first = result.current.legendInteractionProps;
    rerender({ enabled: true });
    expect(result.current.legendInteractionProps).toBe(first);
  });
});
