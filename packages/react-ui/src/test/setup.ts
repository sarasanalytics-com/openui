/**
 * Vitest setup for jsdom-based component tests.
 *
 * jsdom ships no canvas implementation, so `canvas.getContext("2d")` returns null.
 * Chart code (`useCanvasContextForLabelSize`) measures label widths through a 2D
 * context, so we stub the minimum surface it uses.
 */
const measureTextStub = (text: string) => ({ width: text.length * 7 }) as TextMetrics;

if (typeof HTMLCanvasElement !== "undefined") {
  HTMLCanvasElement.prototype.getContext = function getContext() {
    return {
      font: "",
      measureText: measureTextStub,
    } as unknown as CanvasRenderingContext2D;
  } as unknown as HTMLCanvasElement["getContext"];
}

/**
 * jsdom has no ResizeObserver, which both the chart components and Recharts'
 * ResponsiveContainer construct on mount. The stub never fires — chart tests
 * pass explicit `width`/`height` instead of relying on observed dimensions.
 */
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}
