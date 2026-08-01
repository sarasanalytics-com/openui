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
