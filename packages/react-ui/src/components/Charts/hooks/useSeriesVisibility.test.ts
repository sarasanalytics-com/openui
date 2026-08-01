import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useSeriesVisibility, type SeriesVisibilityChange } from "./useSeriesVisibility";

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

describe("useSeriesVisibility onChange", () => {
  const renderWithSpy = (onChange: (change: SeriesVisibilityChange) => void, keys = KEYS) =>
    renderHook(() => useSeriesVisibility(keys, onChange));

  it("reports a hide with the keys still visible", () => {
    const onChange = vi.fn();
    const { result } = renderWithSpy(onChange);

    act(() => result.current.toggle("revenue"));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({
      key: "revenue",
      action: "hide",
      visibleKeys: ["sales", "profit"],
    });
  });

  it("reports a show when a hidden series comes back", () => {
    const onChange = vi.fn();
    const { result } = renderWithSpy(onChange);

    act(() => result.current.toggle("revenue"));
    act(() => result.current.toggle("revenue"));

    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenLastCalledWith({
      key: "revenue",
      action: "show",
      visibleKeys: KEYS,
    });
  });

  it("reports an isolate with only that series visible", () => {
    const onChange = vi.fn();
    const { result } = renderWithSpy(onChange);

    act(() => result.current.isolate("profit"));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({
      key: "profit",
      action: "isolate",
      visibleKeys: ["profit"],
    });
  });

  it("reports a restore when an isolate is undone", () => {
    const onChange = vi.fn();
    const { result } = renderWithSpy(onChange);

    act(() => result.current.isolate("profit"));
    act(() => result.current.isolate("profit"));

    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenLastCalledWith({
      key: "profit",
      action: "restore",
      visibleKeys: KEYS,
    });
  });

  it("reports a keyless restore from showAll", () => {
    const onChange = vi.fn();
    const { result } = renderWithSpy(onChange);

    act(() => result.current.toggle("revenue"));
    onChange.mockClear();
    act(() => result.current.showAll());

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({
      key: "",
      action: "restore",
      visibleKeys: KEYS,
    });
  });

  it("stays silent when showAll has nothing to restore", () => {
    const onChange = vi.fn();
    const { result } = renderWithSpy(onChange);

    act(() => result.current.showAll());

    expect(onChange).not.toHaveBeenCalled();
  });

  it("stays silent when hiding the last visible series is blocked", () => {
    const onChange = vi.fn();
    const { result } = renderWithSpy(onChange);

    act(() => result.current.isolate("sales"));
    onChange.mockClear();
    act(() => result.current.toggle("sales"));

    expect(onChange).not.toHaveBeenCalled();
    expect(result.current.visibleKeys).toEqual(["sales"]);
  });

  it("stays silent for keys that are not part of the chart", () => {
    const onChange = vi.fn();
    const { result } = renderWithSpy(onChange);

    act(() => result.current.toggle("unknown"));
    act(() => result.current.isolate("unknown"));

    expect(onChange).not.toHaveBeenCalled();
  });

  it("stays silent when isolating the only series of a single-series chart", () => {
    const onChange = vi.fn();
    const { result } = renderWithSpy(onChange, ["sales"]);

    act(() => result.current.isolate("sales"));

    expect(onChange).not.toHaveBeenCalled();
  });

  it("calls the latest onChange without breaking callback stability", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { result, rerender } = renderHook(({ onChange }) => useSeriesVisibility(KEYS, onChange), {
      initialProps: { onChange: first },
    });

    const callbacks = result.current;
    rerender({ onChange: second });

    expect(result.current.toggle).toBe(callbacks.toggle);
    expect(result.current.isolate).toBe(callbacks.isolate);
    expect(result.current.showAll).toBe(callbacks.showAll);

    act(() => result.current.toggle("revenue"));

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith({
      key: "revenue",
      action: "hide",
      visibleKeys: ["sales", "profit"],
    });
  });

  it("clears hidden state when enabled flips, without reporting it", () => {
    const onChange = vi.fn();
    const { result, rerender } = renderHook(
      ({ enabled }) => useSeriesVisibility(KEYS, onChange, { enabled }),
      { initialProps: { enabled: true } },
    );

    act(() => result.current.toggle("revenue"));
    onChange.mockClear();

    rerender({ enabled: false });
    expect(result.current.hiddenKeys.size).toBe(0);

    rerender({ enabled: true });
    expect(result.current.hiddenKeys.size).toBe(0);
    expect(result.current.visibleKeys).toEqual(KEYS);
    // Render-phase resets are silent by design.
    expect(onChange).not.toHaveBeenCalled();
  });

  it("works without an onChange", () => {
    const { result } = renderHook(() => useSeriesVisibility(KEYS));

    expect(() => act(() => result.current.toggle("revenue"))).not.toThrow();
    expect(result.current.visibleKeys).toEqual(["sales", "profit"]);
  });
});
