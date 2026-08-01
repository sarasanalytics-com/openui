import { fireEvent, render, screen } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { stubChartLayout } from "../../../test/chartLayout";
import {
  countSlices,
  doubleClickLegendItem,
  getLegendItem,
  getLegendItems,
  getStackedLegendColors,
  getStackedLegendPercentages,
} from "../../../test/legendInteraction";
import { RadialChart } from "./RadialChart";

const fourCategories = [
  { channel: "Organic", visits: 40 },
  { channel: "Paid", visits: 30 },
  { channel: "Referral", visits: 20 },
  { channel: "Email", visits: 10 },
];

const twoCategories = [
  { channel: "Organic", visits: 40 },
  { channel: "Paid", visits: 60 },
];

let restoreLayout = () => {};
beforeAll(() => {
  restoreLayout = stubChartLayout();
});
afterAll(() => restoreLayout());

const renderChart = (props: Partial<React.ComponentProps<typeof RadialChart>> = {}) =>
  render(
    <RadialChart
      data={fourCategories}
      categoryKey="channel"
      dataKey="visits"
      {...(props as object)}
    />,
  );

describe("RadialChart interactive legend", () => {
  it("renders an interactive legend row per category by default", () => {
    renderChart();

    expect(getLegendItems()).toHaveLength(4);
    expect(getLegendItems().map((row) => row.getAttribute("aria-pressed"))).toEqual([
      "true",
      "true",
      "true",
      "true",
    ]);
  });

  it("removes a bar on legend click and brings it back", () => {
    const { container } = renderChart();

    expect(countSlices(container, "radial-bar")).toBe(4);

    fireEvent.click(getLegendItem("Paid"));
    expect(countSlices(container, "radial-bar")).toBe(3);
    expect(getLegendItem("Paid").getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(getLegendItem("Paid"));
    expect(countSlices(container, "radial-bar")).toBe(4);
  });

  it("re-sums the visible percentages to 100 when a category is hidden", () => {
    const { container } = renderChart();

    expect(getStackedLegendPercentages(container)).toEqual([40, 30, 20, 10]);

    fireEvent.click(getLegendItem("Paid"));

    const [organic, paid, referral, email] = getStackedLegendPercentages(container);
    expect(organic! + referral! + email!).toBeCloseTo(100, 0);
    expect(paid).toBe(30);
  });

  it("keeps every category on its original palette color when one is hidden", () => {
    const { container } = renderChart();

    const colorsBefore = getStackedLegendColors(container);
    expect(new Set(colorsBefore).size).toBe(4);

    fireEvent.click(getLegendItem("Paid"));

    expect(getStackedLegendColors(container)).toEqual(colorsBefore);
  });

  it("isolates a category on double click and restores everything on the next one", () => {
    const { container } = renderChart();

    doubleClickLegendItem(getLegendItem("Referral"));
    expect(countSlices(container, "radial-bar")).toBe(1);

    doubleClickLegendItem(getLegendItem("Referral"));
    expect(countSlices(container, "radial-bar")).toBe(4);
  });

  it("never hides the last visible category", () => {
    const { container } = renderChart({ data: twoCategories });

    fireEvent.click(getLegendItem("Organic"));
    fireEvent.click(getLegendItem("Paid"));

    expect(countSlices(container, "radial-bar")).toBe(1);
  });

  it("drives the same visibility state from the default legend variant", () => {
    const { container } = renderChart({ legendVariant: "default" });

    fireEvent.click(getLegendItem("Paid"));

    expect(countSlices(container, "radial-bar")).toBe(3);
    expect(getLegendItem("Paid").style.opacity).toBe("0.3");
  });

  it("keeps the legend static when interactiveLegend is false", () => {
    const { container } = renderChart({ interactiveLegend: false });

    expect(screen.queryAllByRole("button", { name: /press Enter to toggle series/ })).toHaveLength(
      0,
    );

    const row = container.querySelectorAll(".openui-stacked-legend__item")[1] as HTMLElement;
    fireEvent.click(row);

    expect(countSlices(container, "radial-bar")).toBe(4);
    expect(getStackedLegendPercentages(container)).toEqual([40, 30, 20, 10]);
  });
});
