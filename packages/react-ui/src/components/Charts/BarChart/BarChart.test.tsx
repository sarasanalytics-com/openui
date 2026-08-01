import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  countSeries,
  doubleClickLegendItem,
  getLegendColors,
  getLegendItem,
  getLegendItems,
  getLegendPressedStates,
} from "../../../test/legendInteraction";
import { BarChart } from "./BarChart";

const fourSeries = [
  { month: "Jan", sales: 10, revenue: 20, costs: 30, margin: 40 },
  { month: "Feb", sales: 15, revenue: 25, costs: 35, margin: 45 },
];

const twoSeries = [
  { month: "Jan", sales: 10, revenue: 20 },
  { month: "Feb", sales: 15, revenue: 25 },
];

/** Two series on the left axis, one (with a wildly different scale) on the right. */
const dualAxisData = [
  { month: "Jan", sales: 10, revenue: 20, conversionRate: 0.4 },
  { month: "Feb", sales: 15, revenue: 25, conversionRate: 0.8 },
];

const renderChart = (props: Partial<React.ComponentProps<typeof BarChart>> = {}) =>
  render(
    <BarChart
      data={fourSeries}
      categoryKey="month"
      width={800}
      height={400}
      isAnimationActive={false}
      {...(props as object)}
    />,
  );

describe("BarChart interactive legend", () => {
  it("renders an interactive legend item per series by default", () => {
    renderChart();

    expect(getLegendItems()).toHaveLength(4);
    expect(getLegendPressedStates()).toEqual(["true", "true", "true", "true"]);
  });

  it("hides a series on legend click and restores it on the next click", () => {
    const { container } = renderChart();

    expect(countSeries(container, "bar")).toBe(4);

    fireEvent.click(getLegendItem("revenue"));
    expect(countSeries(container, "bar")).toBe(3);
    expect(getLegendPressedStates()).toEqual(["true", "false", "true", "true"]);

    fireEvent.click(getLegendItem("revenue"));
    expect(countSeries(container, "bar")).toBe(4);
    expect(getLegendPressedStates()).toEqual(["true", "true", "true", "true"]);
  });

  it("keeps every series on its original palette color when one is hidden", () => {
    const { container } = renderChart();

    const colorsBefore = getLegendColors(container);
    expect(colorsBefore).toHaveLength(4);
    expect(new Set(colorsBefore).size).toBe(4);

    fireEvent.click(getLegendItem("revenue"));

    // Colors are assigned positionally over the FULL key list, so hiding a
    // series must not recolor the survivors.
    expect(getLegendColors(container)).toEqual(colorsBefore);
  });

  it("isolates a series on double click and restores everything on the next one", () => {
    const { container } = renderChart();

    doubleClickLegendItem(getLegendItem("costs"));
    expect(countSeries(container, "bar")).toBe(1);
    expect(getLegendPressedStates()).toEqual(["false", "false", "true", "false"]);

    doubleClickLegendItem(getLegendItem("costs"));
    expect(countSeries(container, "bar")).toBe(4);
    expect(getLegendPressedStates()).toEqual(["true", "true", "true", "true"]);
  });

  it("never hides the last visible series", () => {
    const { container } = renderChart({ data: twoSeries });

    fireEvent.click(getLegendItem("sales"));
    fireEvent.click(getLegendItem("revenue"));

    expect(countSeries(container, "bar")).toBe(1);
  });

  it("keeps a stacked chart rendering with a series hidden", () => {
    const { container } = renderChart({ variant: "stacked" });

    fireEvent.click(getLegendItem("margin"));

    expect(countSeries(container, "bar")).toBe(3);
    expect(getLegendColors(container)).toHaveLength(4);
  });

  it("keeps rendering in dual-axis mode when a primary series is hidden", () => {
    const { container } = renderChart({
      data: dualAxisData,
      secondaryDataKeys: ["conversionRate"],
    });

    expect(countSeries(container, "bar")).toBe(3);

    fireEvent.click(getLegendItem("sales"));
    expect(countSeries(container, "bar")).toBe(2);
    // The right-axis series is untouched.
    expect(getLegendItem("conversionRate").getAttribute("aria-pressed")).toBe("true");

    // Even with every primary series hidden the chart must still render — the
    // hidden left/right axes stay mounted.
    fireEvent.click(getLegendItem("revenue"));
    expect(countSeries(container, "bar")).toBe(1);
    expect(getLegendItem("conversionRate").getAttribute("aria-pressed")).toBe("true");
  });

  it("reports a legend click through onSeriesVisibilityChange", () => {
    const onSeriesVisibilityChange = vi.fn();
    renderChart({ onSeriesVisibilityChange });

    fireEvent.click(getLegendItem("revenue"));

    expect(onSeriesVisibilityChange).toHaveBeenCalledTimes(1);
    expect(onSeriesVisibilityChange).toHaveBeenCalledWith({
      key: "revenue",
      action: "hide",
      visibleKeys: ["sales", "costs", "margin"],
    });
  });

  it("keeps the legend static when interactiveLegend is false", () => {
    const { container } = renderChart({ interactiveLegend: false });

    expect(getLegendItems()).toHaveLength(0);

    const item = container.querySelectorAll(".openui-chart-legend-item")[1] as HTMLElement;
    fireEvent.click(item);

    expect(countSeries(container, "bar")).toBe(4);
    expect(item.style.opacity).toBe("");
  });
});
