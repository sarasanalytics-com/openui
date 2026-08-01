import { fireEvent, render } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { stubChartLayout } from "../../test/chartLayout";
import {
  countSeries,
  getLegendColors,
  getLegendItem,
  getLegendItems,
} from "../../test/legendInteraction";
import { AreaChartCondensed } from "./AreaChartCondensed/AreaChartCondensed";
import { BarChartCondensed } from "./BarChartCondensed/BarChartCondensed";
import { HorizontalBarChart } from "./HorizontalBarChart/HorizontalBarChart";
import { LineChartCondensed } from "./LineChartCondensed/LineChartCondensed";
import { RadarChart } from "./RadarChart/RadarChart";
import { ScatterChart } from "./ScatterChart/ScatterChart";

const data = [
  { month: "Jan", sales: 10, revenue: 20, costs: 30 },
  { month: "Feb", sales: 15, revenue: 25, costs: 35 },
];

const shared = {
  data,
  categoryKey: "month" as const,
  width: 800,
  height: 400,
  isAnimationActive: false,
};

describe("BarChartCondensed interactive legend", () => {
  it("hides a series and keeps the palette positional", () => {
    const { container } = render(<BarChartCondensed {...shared} />);

    const colorsBefore = getLegendColors(container);
    // 3 in the main chart + 3 in the shadow Y-axis chart.
    expect(countSeries(container, "bar")).toBe(6);

    fireEvent.click(getLegendItem("revenue"));

    // The hidden series leaves BOTH charts, so the axis domain rescales too.
    expect(countSeries(container, "bar")).toBe(4);
    expect(getLegendColors(container)).toEqual(colorsBefore);
  });

  it("isolates a series from the keyboard with Shift+Enter", () => {
    const { container } = render(<BarChartCondensed {...shared} />);

    fireEvent.keyDown(getLegendItem("sales"), { key: "Enter", shiftKey: true });

    // Only sales is left, in the main chart and in the shadow Y-axis chart.
    expect(countSeries(container, "bar")).toBe(2);
    expect(getLegendItem("revenue").getAttribute("aria-pressed")).toBe("false");
    expect(getLegendItem("sales").getAttribute("aria-pressed")).toBe("true");
  });

  it("keeps the legend static when interactiveLegend is false", () => {
    render(<BarChartCondensed {...shared} interactiveLegend={false} />);
    expect(getLegendItems()).toHaveLength(0);
  });

  it("keeps the legend static when the legend itself is off", () => {
    render(<BarChartCondensed {...shared} legend={false} />);
    expect(getLegendItems()).toHaveLength(0);
  });
});

describe("LineChartCondensed interactive legend", () => {
  it("hides and restores a series", () => {
    const { container } = render(<LineChartCondensed {...shared} />);

    fireEvent.click(getLegendItem("sales"));
    expect(countSeries(container, "line")).toBe(2);

    fireEvent.click(getLegendItem("sales"));
    expect(countSeries(container, "line")).toBe(3);
  });
});

describe("AreaChartCondensed interactive legend", () => {
  it("hides a stacked series", () => {
    const { container } = render(<AreaChartCondensed {...shared} />);

    fireEvent.click(getLegendItem("costs"));
    expect(countSeries(container, "area")).toBe(2);
  });
});

// HorizontalBarChart and RadarChart size themselves from an observed container,
// which jsdom reports as 0x0. `stubChartLayout` hands them a real box so the
// rendered series can be counted like every other chart here.
describe("HorizontalBarChart interactive legend", () => {
  let restoreLayout = () => {};
  beforeAll(() => {
    restoreLayout = stubChartLayout();
  });
  afterAll(() => restoreLayout());

  it("hides a series and keeps the palette positional", () => {
    const { container } = render(<HorizontalBarChart {...shared} />);

    const colorsBefore = getLegendColors(container);
    // 3 in the main chart + 3 in the shadow axis chart.
    expect(countSeries(container, "bar")).toBe(6);

    fireEvent.click(getLegendItem("revenue"));

    expect(countSeries(container, "bar")).toBe(4);
    expect(getLegendItem("revenue").getAttribute("aria-pressed")).toBe("false");
    expect(getLegendItem("sales").getAttribute("aria-pressed")).toBe("true");
    expect(getLegendColors(container)).toEqual(colorsBefore);
  });

  it("keeps the legend static when interactiveLegend is false", () => {
    render(<HorizontalBarChart {...shared} interactiveLegend={false} />);
    expect(getLegendItems()).toHaveLength(0);
  });
});

describe("RadarChart interactive legend", () => {
  let restoreLayout = () => {};
  beforeAll(() => {
    restoreLayout = stubChartLayout();
  });
  afterAll(() => restoreLayout());

  it("hides a series and restores it", () => {
    const { container } = render(<RadarChart {...shared} />);

    expect(countSeries(container, "radar")).toBe(3);

    fireEvent.click(getLegendItem("revenue"));
    expect(countSeries(container, "radar")).toBe(2);
    expect(getLegendItem("revenue").getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(getLegendItem("revenue"));
    expect(countSeries(container, "radar")).toBe(3);
    expect(getLegendItem("revenue").getAttribute("aria-pressed")).toBe("true");
  });

  it("keeps the legend static when interactiveLegend is false", () => {
    render(<RadarChart {...shared} interactiveLegend={false} />);
    expect(getLegendItems()).toHaveLength(0);
  });
});

describe("ScatterChart interactive legend", () => {
  // Scatter is the odd one out: visibility keys are dataset names, and hiding a
  // dataset must drop its points AND rescale both axes.
  const scatterData = [
    {
      name: "alpha",
      data: [
        { x: 1, y: 1 },
        { x: 2, y: 2 },
      ],
    },
    {
      name: "beta",
      data: [
        { x: 10, y: 10 },
        { x: 20, y: 20 },
      ],
    },
    {
      name: "gamma",
      data: [
        { x: 100, y: 100 },
        { x: 200, y: 200 },
      ],
    },
  ];

  const countPoints = (container: HTMLElement) =>
    container.querySelectorAll(".recharts-scatter-symbol").length;

  it("removes a hidden dataset's points while keeping dataset colors positional", () => {
    const { container } = render(<ScatterChart data={scatterData} width={800} height={400} />);

    const colorsBefore = getLegendColors(container);
    const pointsBefore = countPoints(container);
    expect(pointsBefore).toBeGreaterThan(0);

    fireEvent.click(getLegendItem("beta"));

    expect(countPoints(container)).toBeLessThan(pointsBefore);
    expect(getLegendColors(container)).toEqual(colorsBefore);
    expect(getLegendItem("beta").getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(getLegendItem("beta"));
    expect(countPoints(container)).toBe(pointsBefore);
  });

  it("keeps the legend static when interactiveLegend is false", () => {
    render(<ScatterChart data={scatterData} width={800} height={400} interactiveLegend={false} />);
    expect(getLegendItems()).toHaveLength(0);
  });
});
