import { fireEvent, render, screen } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { stubChartLayout } from "../../../test/chartLayout";
import {
  doubleClickLegendItem,
  getLegendColors,
  getLegendItem,
  getLegendItems,
  getStackedLegendPercentages,
} from "../../../test/legendInteraction";
import { SingleStackedBar } from "./SingleStackedBarChart";

const fourSegments = [
  { stage: "Awareness", users: 40 },
  { stage: "Interest", users: 30 },
  { stage: "Decision", users: 20 },
  { stage: "Action", users: 10 },
];

const twoSegments = [
  { stage: "Awareness", users: 40 },
  { stage: "Action", users: 60 },
];

let restoreLayout = () => {};
beforeAll(() => {
  restoreLayout = stubChartLayout();
});
afterAll(() => restoreLayout());

const SEGMENT_SELECTOR = ".openui-single-stacked-bar-chart-segment";

const getSegmentWidths = (container: HTMLElement): number[] =>
  [...container.querySelectorAll(SEGMENT_SELECTOR)].map((node) =>
    Number.parseFloat((node as HTMLElement).style.width),
  );

const renderChart = (props: Partial<React.ComponentProps<typeof SingleStackedBar>> = {}) =>
  render(
    <SingleStackedBar
      data={fourSegments}
      categoryKey="stage"
      dataKey="users"
      animated={false}
      {...(props as object)}
    />,
  );

describe("SingleStackedBar interactive legend", () => {
  it("renders an interactive legend item per segment by default", () => {
    renderChart();

    expect(getLegendItems()).toHaveLength(4);
    expect(getLegendItems().map((item) => item.getAttribute("aria-pressed"))).toEqual([
      "true",
      "true",
      "true",
      "true",
    ]);
  });

  it("removes a segment on legend click and recomputes the remaining widths to 100%", () => {
    const { container } = renderChart();

    expect(getSegmentWidths(container)).toEqual([40, 30, 20, 10]);

    fireEvent.click(getLegendItem("Interest"));

    const widths = getSegmentWidths(container);
    expect(widths).toHaveLength(3);
    expect(widths.reduce((sum, width) => sum + width, 0)).toBeCloseTo(100, 5);
    expect(widths[0]).toBeCloseTo(57.14, 2);

    fireEvent.click(getLegendItem("Interest"));
    expect(getSegmentWidths(container)).toEqual([40, 30, 20, 10]);
  });

  it("keeps every segment on its original palette color when one is hidden", () => {
    const { container } = renderChart();

    const colorsBefore = getLegendColors(container);
    expect(colorsBefore).toHaveLength(4);

    fireEvent.click(getLegendItem("Interest"));

    // Colors are positional over the FULL segment list, so the survivors keep theirs.
    expect(getLegendColors(container)).toEqual(colorsBefore);
  });

  it("isolates a segment on double click and restores everything on the next one", () => {
    const { container } = renderChart();

    doubleClickLegendItem(getLegendItem("Decision"));
    expect(getSegmentWidths(container)).toEqual([100]);

    doubleClickLegendItem(getLegendItem("Decision"));
    expect(getSegmentWidths(container)).toEqual([40, 30, 20, 10]);
  });

  it("never hides the last visible segment", () => {
    const { container } = renderChart({ data: twoSegments });

    fireEvent.click(getLegendItem("Awareness"));
    fireEvent.click(getLegendItem("Action"));

    expect(container.querySelectorAll(SEGMENT_SELECTOR)).toHaveLength(1);
  });

  it("dims the hidden legend item and reports it as unpressed", () => {
    renderChart();

    fireEvent.click(getLegendItem("Interest"));

    expect(getLegendItem("Interest").getAttribute("aria-pressed")).toBe("false");
    expect(getLegendItem("Interest").style.opacity).toBe("0.3");
  });

  it("drives the same visibility state from the stacked legend variant", () => {
    const { container } = renderChart({ legendVariant: "stacked" });

    expect(getStackedLegendPercentages(container)).toEqual([40, 30, 20, 10]);

    fireEvent.click(getLegendItem("Interest"));

    expect(getSegmentWidths(container)).toHaveLength(3);
    const [awareness, interest] = getStackedLegendPercentages(container);
    expect(awareness).toBeCloseTo(57.1, 1);
    // The hidden row keeps reporting its original share.
    expect(interest).toBe(30);
  });

  it("keeps the legend static when interactiveLegend is false", () => {
    const { container } = renderChart({ interactiveLegend: false });

    expect(screen.queryAllByRole("button", { name: /press Enter to toggle series/ })).toHaveLength(
      0,
    );

    const item = container.querySelectorAll(".openui-chart-legend-item")[1] as HTMLElement;
    fireEvent.click(item);

    expect(getSegmentWidths(container)).toEqual([40, 30, 20, 10]);
    expect(item.style.opacity).toBe("");
  });
});
