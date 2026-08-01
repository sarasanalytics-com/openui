import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  countSeries,
  doubleClickLegendItem,
  getLegendColors,
  getLegendItem,
  getLegendItems,
} from "../../../test/legendInteraction";
import { AreaChart } from "./AreaChart";

// AreaChart always stacks (`stackId="a"`), so hiding a series has to drop out of
// the stack AND out of the shadow Y-axis chart for the domain to rescale.
const data = [
  { month: "Jan", sales: 10, revenue: 20, costs: 30 },
  { month: "Feb", sales: 15, revenue: 25, costs: 35 },
];

const renderChart = (props: Partial<React.ComponentProps<typeof AreaChart>> = {}) =>
  render(
    <AreaChart
      data={data}
      categoryKey="month"
      width={800}
      height={400}
      isAnimationActive={false}
      {...(props as object)}
    />,
  );

describe("AreaChart interactive legend", () => {
  it("drops a hidden series out of the stack and puts it back", () => {
    const { container } = renderChart();

    expect(countSeries(container, "area")).toBe(3);

    fireEvent.click(getLegendItem("revenue"));
    expect(countSeries(container, "area")).toBe(2);

    fireEvent.click(getLegendItem("revenue"));
    expect(countSeries(container, "area")).toBe(3);
  });

  it("keeps the palette positional when a stacked series is hidden", () => {
    const { container } = renderChart();

    const colorsBefore = getLegendColors(container);
    fireEvent.click(getLegendItem("revenue"));

    expect(getLegendColors(container)).toEqual(colorsBefore);
    // Every series keeps its legend entry, just dimmed.
    expect(getLegendItems()).toHaveLength(3);
  });

  it("isolates a series on double click", () => {
    const { container } = renderChart();

    doubleClickLegendItem(getLegendItem("sales"));

    expect(countSeries(container, "area")).toBe(1);
    expect(getLegendItem("sales").getAttribute("aria-pressed")).toBe("true");
  });

  it("keeps the legend static when interactiveLegend is false", () => {
    const { container } = renderChart({ interactiveLegend: false });

    expect(getLegendItems()).toHaveLength(0);
    expect(countSeries(container, "area")).toBe(3);
  });
});
