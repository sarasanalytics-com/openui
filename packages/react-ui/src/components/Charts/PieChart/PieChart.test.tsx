import { fireEvent, render } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { stubChartLayout } from "../../../test/chartLayout";
import {
  countSlices,
  doubleClickLegendItem,
  getLegendColors,
  getLegendItem,
  getLegendItems,
  getStackedLegendColors,
  getStackedLegendPercentages,
} from "../../../test/legendInteraction";
import { PieChart } from "./PieChart";

const fourSlices = [
  { channel: "Organic", visits: 40 },
  { channel: "Paid", visits: 30 },
  { channel: "Referral", visits: 20 },
  { channel: "Email", visits: 10 },
];

const twoSlices = [
  { channel: "Organic", visits: 40 },
  { channel: "Paid", visits: 60 },
];

let restoreLayout = () => {};
beforeAll(() => {
  restoreLayout = stubChartLayout();
});
afterAll(() => restoreLayout());

const renderChart = (props: Partial<React.ComponentProps<typeof PieChart>> = {}) =>
  render(
    <PieChart
      data={fourSlices}
      categoryKey="channel"
      dataKey="visits"
      isAnimationActive={false}
      {...(props as object)}
    />,
  );

describe("PieChart interactive legend", () => {
  it("renders an interactive legend row per slice by default", () => {
    renderChart();

    expect(getLegendItems()).toHaveLength(4);
    expect(getLegendItems().map((row) => row.getAttribute("aria-pressed"))).toEqual([
      "true",
      "true",
      "true",
      "true",
    ]);
  });

  it("removes a slice from the pie on legend click and brings it back", () => {
    const { container } = renderChart();

    expect(countSlices(container, "pie")).toBe(4);

    fireEvent.click(getLegendItem("Paid"));
    expect(countSlices(container, "pie")).toBe(3);
    expect(getLegendItem("Paid").getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(getLegendItem("Paid"));
    expect(countSlices(container, "pie")).toBe(4);
    expect(getLegendItem("Paid").getAttribute("aria-pressed")).toBe("true");
  });

  it("re-sums the visible percentages to 100 when a slice is hidden", () => {
    const { container } = renderChart();

    expect(getStackedLegendPercentages(container)).toEqual([40, 30, 20, 10]);

    fireEvent.click(getLegendItem("Paid"));

    const [organic, paid, referral, email] = getStackedLegendPercentages(container);
    // Visible slices re-base on the 70 that is left...
    expect(organic! + referral! + email!).toBeCloseTo(100, 0);
    expect(organic).toBeCloseTo(57.1, 1);
    // ...while the hidden row keeps reporting its original share.
    expect(paid).toBe(30);
  });

  it("keeps every slice on its original palette color when one is hidden", () => {
    const { container } = renderChart();

    const colorsBefore = getStackedLegendColors(container);
    expect(colorsBefore).toHaveLength(4);
    expect(new Set(colorsBefore).size).toBe(4);

    fireEvent.click(getLegendItem("Paid"));

    expect(getStackedLegendColors(container)).toEqual(colorsBefore);
  });

  it("isolates a slice on double click and restores everything on the next one", () => {
    const { container } = renderChart();

    doubleClickLegendItem(getLegendItem("Referral"));
    expect(countSlices(container, "pie")).toBe(1);
    expect(getStackedLegendPercentages(container)[2]).toBe(100);

    doubleClickLegendItem(getLegendItem("Referral"));
    expect(countSlices(container, "pie")).toBe(4);
  });

  it("never hides the last visible slice", () => {
    const { container } = renderChart({ data: twoSlices });

    fireEvent.click(getLegendItem("Organic"));
    fireEvent.click(getLegendItem("Paid"));

    expect(countSlices(container, "pie")).toBe(1);
  });

  it("renders both donut rings and drops both on hide", () => {
    const { container } = renderChart({ variant: "donut" });

    // Inner + outer ring per slice.
    expect(countSlices(container, "pie")).toBe(8);

    fireEvent.click(getLegendItem("Email"));

    expect(countSlices(container, "pie")).toBe(6);
  });

  it("drives the same visibility state from the default legend variant", () => {
    const { container } = renderChart({ legendVariant: "default" });

    const colorsBefore = getLegendColors(container);
    expect(countSlices(container, "pie")).toBe(4);

    fireEvent.click(getLegendItem("Paid"));

    expect(countSlices(container, "pie")).toBe(3);
    expect(getLegendColors(container)).toEqual(colorsBefore);
    expect(getLegendItem("Paid").getAttribute("data-hidden")).toBe("true");
  });

  it("reports plain category names to onSeriesVisibilityChange", () => {
    const onSeriesVisibilityChange = vi.fn();
    renderChart({ onSeriesVisibilityChange });

    fireEvent.click(getLegendItem("Paid"));

    // Never the internal `Paid-1` row key.
    expect(onSeriesVisibilityChange).toHaveBeenCalledWith({
      key: "Paid",
      action: "hide",
      visibleKeys: ["Organic", "Referral", "Email"],
    });
  });

  it("toggles duplicate-named slices independently", () => {
    const { container } = renderChart({
      data: [
        { channel: "Other", visits: 40 },
        { channel: "Other", visits: 30 },
        { channel: "Direct", visits: 20 },
      ],
    });

    expect(countSlices(container, "pie")).toBe(3);

    const [firstOther, secondOther] = getLegendItems();
    fireEvent.click(firstOther!);

    // Only the row that was clicked goes away.
    expect(countSlices(container, "pie")).toBe(2);
    expect(firstOther!.getAttribute("aria-pressed")).toBe("false");
    expect(secondOther!.getAttribute("aria-pressed")).toBe("true");

    // ...and the two same-named rows keep distinct colors.
    const colors = getStackedLegendColors(container);
    expect(colors[0]).not.toBe(colors[1]);
  });

  it("keeps the legend static when interactiveLegend is false", () => {
    const { container } = renderChart({ interactiveLegend: false });

    expect(getLegendItems()).toHaveLength(0);

    const row = container.querySelectorAll(".openui-stacked-legend__item")[1] as HTMLElement;
    fireEvent.click(row);

    expect(countSlices(container, "pie")).toBe(4);
    expect(getStackedLegendPercentages(container)).toEqual([40, 30, 20, 10]);
  });
});
