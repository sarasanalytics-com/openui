/**
 * jsdom reports every element as 0x0 and never fires `ResizeObserver`, so the
 * categorical charts (Pie, Radial) size themselves — and Recharts' own
 * `ResponsiveContainer` sizes itself — to nothing, and no slice is ever rendered.
 *
 * `stubChartLayout` hands every observer and every `getBoundingClientRect` call a
 * fixed, non-zero box so the chart bodies actually render and can be asserted on.
 * Call it in `beforeAll` and run the returned restore function in `afterAll`.
 */
export const stubChartLayout = ({ width = 600, height = 400 } = {}): (() => void) => {
  const originalResizeObserver = globalThis.ResizeObserver;
  const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;

  globalThis.ResizeObserver = class SizedResizeObserverStub {
    constructor(private readonly callback: ResizeObserverCallback) {}

    observe(target: Element) {
      this.callback(
        [{ target, contentRect: { width, height } } as unknown as ResizeObserverEntry],
        this as unknown as ResizeObserver,
      );
    }

    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;

  Element.prototype.getBoundingClientRect = function getBoundingClientRectStub() {
    return {
      width,
      height,
      top: 0,
      left: 0,
      right: width,
      bottom: height,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect;
  };

  return () => {
    globalThis.ResizeObserver = originalResizeObserver;
    Element.prototype.getBoundingClientRect = originalGetBoundingClientRect;
  };
};
