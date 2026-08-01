import { fireEvent, screen } from "@testing-library/react";

/**
 * Test helpers shared by the interactive-legend chart tests.
 *
 * Legend items become `role="button"` only when the chart wires the interaction
 * handlers, so `getLegendItems` doubles as the "is the legend interactive?"
 * probe.
 */

/** Every interactive legend item, in series order. */
export const getLegendItems = (): HTMLElement[] => screen.queryAllByRole("button");

/** The interactive legend item for a series, matched on its accessible label. */
export const getLegendItem = (label: string): HTMLElement =>
  screen.getByRole("button", { name: `${label}; press Enter to toggle series` });

/**
 * The palette color rendered on each legend swatch, in series order.
 *
 * Colors are positional over the FULL key list, so this list must be identical
 * before and after hiding a series.
 */
export const getLegendColors = (container: HTMLElement): string[] =>
  [...container.querySelectorAll(".openui-chart-legend-item-indicator")].map(
    (node) => (node as HTMLElement).style.backgroundColor,
  );

/** Which series the legend currently reports as visible (`aria-pressed`). */
export const getLegendPressedStates = (): (string | null)[] =>
  getLegendItems().map((item) => item.getAttribute("aria-pressed"));

/** Number of rendered series elements of the given Recharts kind. */
export const countSeries = (container: HTMLElement, kind: "bar" | "line" | "area" | "radar") =>
  container.querySelectorAll(`.recharts-${kind}`).length;

/**
 * Reproduces a browser double click: two `click`s land before `dblclick`, so the
 * chart sees two toggles (which cancel out) followed by the isolate.
 */
export const doubleClickLegendItem = (item: HTMLElement) => {
  fireEvent.click(item);
  fireEvent.click(item);
  fireEvent.doubleClick(item);
};
