import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  countSeries,
  doubleClickLegendItem,
  getLegendColors,
  getLegendItem,
  getLegendItems,
} from "../../../test/legendInteraction";
import { LineChart } from "./LineChart";

/** Two series on the left axis, one (with a wildly different scale) on the right. */
const dualAxisData = [
  { month: "Jan", sales: 1_000, revenue: 2_000, conversionRate: 0.4 },
  { month: "Feb", sales: 1_500, revenue: 2_500, conversionRate: 0.8 },
];

const renderChart = (props: Partial<React.ComponentProps<typeof LineChart>> = {}) =>
  render(
    <LineChart
      data={dualAxisData}
      categoryKey="month"
      width={800}
      height={400}
      isAnimationActive={false}
      secondaryDataKeys={["conversionRate"]}
      {...(props as object)}
    />,
  );

describe("LineChart interactive legend", () => {
  it("hides and restores a primary-axis series without disturbing the secondary one", () => {
    const { container } = renderChart();

    expect(countSeries(container, "line")).toBe(3);

    fireEvent.click(getLegendItem("sales"));
    expect(countSeries(container, "line")).toBe(2);
    expect(getLegendItem("conversionRate").getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(getLegendItem("sales"));
    expect(countSeries(container, "line")).toBe(3);
  });

  it("still renders when every primary-axis series is hidden", () => {
    const { container } = renderChart();

    fireEvent.click(getLegendItem("sales"));
    fireEvent.click(getLegendItem("revenue"));

    expect(countSeries(container, "line")).toBe(1);
    expect(getLegendItem("conversionRate").getAttribute("aria-pressed")).toBe("true");
  });

  it("keeps the palette positional when a series is hidden", () => {
    const { container } = renderChart();

    const colorsBefore = getLegendColors(container);
    fireEvent.click(getLegendItem("revenue"));

    expect(getLegendColors(container)).toEqual(colorsBefore);
  });

  it("isolates the secondary-axis series on double click", () => {
    const { container } = renderChart();

    doubleClickLegendItem(getLegendItem("conversionRate"));

    expect(countSeries(container, "line")).toBe(1);
    expect(getLegendItem("conversionRate").getAttribute("aria-pressed")).toBe("true");
  });

  it("keeps the legend static when interactiveLegend is false", () => {
    const { container } = renderChart({ interactiveLegend: false });

    expect(getLegendItems()).toHaveLength(0);
    expect(countSeries(container, "line")).toBe(3);
  });
});
