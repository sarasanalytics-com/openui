import { fireEvent, screen } from "@testing-library/react";

/**
 * Test helpers shared by the interactive-legend chart tests.
 *
 * Legend items become `role="button"` only when the chart wires the interaction
 * handlers, so `getLegendItems` doubles as the "is the legend interactive?"
 * probe.
 */

/**
 * Every interactive legend item, in series order.
 *
 * Scoped to elements that carry `aria-pressed`: legends also render buttons of
 * their own (show more/less, scroll), which are not legend items.
 */
export const getLegendItems = (): HTMLElement[] =>
  screen.queryAllByRole("button").filter((item) => item.getAttribute("aria-pressed") !== null);

/**
 * The interactive legend item for a series, matched on its accessible name.
 *
 * Legend rows carry no `aria-label`, so the accessible name is the row's own
 * text — the label, plus a percentage on the stacked legend. Hence the prefix
 * match rather than an exact one.
 */
export const getLegendItem = (label: string): HTMLElement => {
  const matches = getLegendItems().filter((item) => {
    const text = (item.textContent ?? "").trim();
    return text === label || text.startsWith(label);
  });
  if (matches.length !== 1) {
    throw new Error(
      `Expected exactly one legend item for "${label}", found ${matches.length}.` +
        ` Use getLegendItems() when labels repeat.`,
    );
  }
  return matches[0]!;
};

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

/**
 * The rendered `StackedLegend` rows, in item order.
 *
 * `queryAllByRole("button")` is unusable here: the stacked legend also renders
 * scroll and show-more/less buttons of its own.
 */
export const getStackedLegendItems = (container: HTMLElement): HTMLElement[] =>
  [...container.querySelectorAll(".openui-stacked-legend__item")] as HTMLElement[];

/**
 * The palette color rendered on each stacked-legend swatch, in item order.
 *
 * Colors are positional over the FULL category list, so this list must be
 * identical before and after hiding a category.
 */
export const getStackedLegendColors = (container: HTMLElement): string[] =>
  [...container.querySelectorAll(".openui-stacked-legend__item-color")].map(
    (node) => (node as HTMLElement).style.backgroundColor,
  );

/** The percentage each stacked-legend row currently reports, in item order. */
export const getStackedLegendPercentages = (container: HTMLElement): number[] =>
  [...container.querySelectorAll(".openui-stacked-legend__item-value")].map((node) =>
    Number.parseFloat(node.textContent ?? ""),
  );

/** Number of rendered series elements of the given Recharts kind. */
export const countSeries = (container: HTMLElement, kind: "bar" | "line" | "area" | "radar") =>
  container.querySelectorAll(`.recharts-${kind}`).length;

/**
 * Number of rendered slices of a categorical chart. Hidden categories are not
 * drawn at all, so this shrinks as they are toggled off.
 */
export const countSlices = (container: HTMLElement, kind: "pie" | "radial-bar") =>
  container.querySelectorAll(`.recharts-${kind}-sector`).length;

/**
 * Reproduces a browser double click: two `click`s land before `dblclick`, so the
 * chart sees two toggles (which cancel out) followed by the isolate.
 */
export const doubleClickLegendItem = (item: HTMLElement) => {
  fireEvent.click(item);
  fireEvent.click(item);
  fireEvent.doubleClick(item);
};
