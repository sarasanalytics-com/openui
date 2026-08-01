import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useSeriesVisibility } from "./useSeriesVisibility";

const KEYS = ["sales", "revenue", "profit"];

describe("useSeriesVisibility", () => {
  it("starts with every series visible", () => {
    const { result } = renderHook(() => useSeriesVisibility(KEYS));

    expect(result.current.visibleKeys).toEqual(KEYS);
    expect(result.current.hiddenKeys.size).toBe(0);
    expect(result.current.isHidden("sales")).toBe(false);
  });

  it("toggle hides and shows a series", () => {
    const { result } = renderHook(() => useSeriesVisibility(KEYS));

    act(() => result.current.toggle("revenue"));
    expect(result.current.visibleKeys).toEqual(["sales", "profit"]);
    expect(result.current.isHidden("revenue")).toBe(true);

    act(() => result.current.toggle("revenue"));
    expect(result.current.visibleKeys).toEqual(KEYS);
    expect(result.current.isHidden("revenue")).toBe(false);
  });

  it("never hides the last visible series", () => {
    const { result } = renderHook(() => useSeriesVisibility(KEYS));

    act(() => result.current.toggle("revenue"));
    act(() => result.current.toggle("profit"));
    expect(result.current.visibleKeys).toEqual(["sales"]);

    act(() => result.current.toggle("sales"));
    expect(result.current.visibleKeys).toEqual(["sales"]);
    expect(result.current.isHidden("sales")).toBe(false);
  });

  it("ignores keys that are not part of the chart", () => {
    const { result } = renderHook(() => useSeriesVisibility(KEYS));

    act(() => result.current.toggle("unknown"));
    expect(result.current.visibleKeys).toEqual(KEYS);

    act(() => result.current.isolate("unknown"));
    expect(result.current.visibleKeys).toEqual(KEYS);
  });

  it("isolate hides every other series", () => {
    const { result } = renderHook(() => useSeriesVisibility(KEYS));

    act(() => result.current.isolate("profit"));
    expect(result.current.visibleKeys).toEqual(["profit"]);
    expect(result.current.hiddenKeys).toEqual(new Set(["sales", "revenue"]));
  });

  it("isolate on the sole visible series restores all", () => {
    const { result } = renderHook(() => useSeriesVisibility(KEYS));

    act(() => result.current.isolate("profit"));
    act(() => result.current.isolate("profit"));
    expect(result.current.visibleKeys).toEqual(KEYS);
    expect(result.current.hiddenKeys.size).toBe(0);
  });

  it("showAll restores every series", () => {
    const { result } = renderHook(() => useSeriesVisibility(KEYS));

    act(() => result.current.isolate("sales"));
    act(() => result.current.showAll());
    expect(result.current.visibleKeys).toEqual(KEYS);
  });

  it("keeps hidden state when re-rendered with an equal (but new) array", () => {
    const { result, rerender } = renderHook(({ keys }) => useSeriesVisibility(keys), {
      initialProps: { keys: [...KEYS] },
    });

    act(() => result.current.toggle("revenue"));
    rerender({ keys: [...KEYS] });

    expect(result.current.visibleKeys).toEqual(["sales", "profit"]);
  });

  it("resets hidden state when the data keys change", () => {
    const { result, rerender } = renderHook(({ keys }) => useSeriesVisibility(keys), {
      initialProps: { keys: KEYS },
    });

    act(() => result.current.toggle("revenue"));
    expect(result.current.hiddenKeys.size).toBe(1);

    rerender({ keys: ["sales", "revenue", "cost"] });

    expect(result.current.hiddenKeys.size).toBe(0);
    expect(result.current.visibleKeys).toEqual(["sales", "revenue", "cost"]);
  });

  it("keeps callback identities stable across re-renders and state changes", () => {
    const { result, rerender } = renderHook(({ keys }) => useSeriesVisibility(keys), {
      initialProps: { keys: KEYS },
    });

    const first = result.current;
    rerender({ keys: KEYS });
    act(() => result.current.toggle("revenue"));

    expect(result.current.toggle).toBe(first.toggle);
    expect(result.current.isolate).toBe(first.isolate);
    expect(result.current.showAll).toBe(first.showAll);
    expect(result.current.isHidden).toBe(first.isHidden);
  });
});
