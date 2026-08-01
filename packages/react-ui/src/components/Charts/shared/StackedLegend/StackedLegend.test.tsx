import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  getStackedLegendColors,
  getStackedLegendItems,
  getStackedLegendPercentages,
} from "../../../../test/legendInteraction";
import { type StackedLegendItem } from "../../types";
import { StackedLegend } from "./StackedLegend";

const items: StackedLegendItem[] = [
  { key: "sales", label: "Sales", value: 60, color: "#3b82f6" },
  { key: "revenue", label: "Revenue", value: 30, color: "#ef4444" },
  { key: "costs", label: "Costs", value: 10, color: "#22c55e" },
];

const renderLegend = (props: Partial<React.ComponentProps<typeof StackedLegend>> = {}) =>
  render(<StackedLegend items={items} layout="scrollable" {...props} />);

/** The interactive row for an item, matched on its accessible label. */
const getRow = (label: string) =>
  screen.getByRole("button", { name: `${label}; press Enter to toggle series` });

describe("StackedLegend", () => {
  it("is not interactive without onItemClick", () => {
    const { container } = renderLegend();

    expect(screen.queryByRole("button")).toBeNull();
    const [first] = getStackedLegendItems(container);
    expect(first?.getAttribute("tabindex")).toBeNull();
    expect(first?.getAttribute("style")).toBeNull();
  });

  it("renders an interactive row per item when onItemClick is provided", () => {
    renderLegend({ onItemClick: () => {} });

    const rows = screen.getAllByRole("button");
    expect(rows).toHaveLength(items.length);
    expect(rows[0]?.getAttribute("tabindex")).toBe("0");
    expect(rows[0]?.getAttribute("aria-label")).toBe("Sales; press Enter to toggle series");
  });

  it("fires onItemClick on click, Enter and Space", () => {
    const onItemClick = vi.fn();
    renderLegend({ onItemClick });

    const row = getRow("Sales");

    fireEvent.click(row);
    fireEvent.keyDown(row, { key: "Enter" });
    fireEvent.keyDown(row, { key: " " });

    expect(onItemClick).toHaveBeenCalledTimes(3);
    expect(onItemClick).toHaveBeenNthCalledWith(1, "sales");
    expect(onItemClick).toHaveBeenNthCalledWith(2, "sales");
    expect(onItemClick).toHaveBeenNthCalledWith(3, "sales");
  });

  it("ignores other keys", () => {
    const onItemClick = vi.fn();
    renderLegend({ onItemClick });

    fireEvent.keyDown(getRow("Sales"), { key: "a" });

    expect(onItemClick).not.toHaveBeenCalled();
  });

  it("fires onItemDoubleClick on double click", () => {
    const onItemDoubleClick = vi.fn();
    renderLegend({ onItemClick: () => {}, onItemDoubleClick });

    fireEvent.doubleClick(getRow("Revenue"));

    expect(onItemDoubleClick).toHaveBeenCalledWith("revenue");
  });

  it("reflects hidden state via aria-pressed and dimmed opacity", () => {
    renderLegend({
      items: [items[0]!, { ...items[1]!, hidden: true }, items[2]!],
      onItemClick: () => {},
    });

    expect(getRow("Sales").getAttribute("aria-pressed")).toBe("true");
    expect(getRow("Sales").style.opacity).toBe("");

    expect(getRow("Revenue").getAttribute("aria-pressed")).toBe("false");
    expect(getRow("Revenue").style.opacity).toBe("0.3");
  });

  it("dims hidden items even without interactivity", () => {
    const { container } = renderLegend({
      items: [items[0]!, { ...items[1]!, hidden: true }, items[2]!],
    });

    expect(getStackedLegendItems(container)[1]?.style.opacity).toBe("0.3");
  });

  it("re-sums the visible percentages to 100 and leaves hidden ones on the full total", () => {
    const { container, rerender } = renderLegend();

    // 60 / 30 / 10 of a 100 total.
    expect(getStackedLegendPercentages(container)).toEqual([60, 30, 10]);

    rerender(<StackedLegend items={[items[0]!, { ...items[1]!, hidden: true }, items[2]!]} />);

    // Visible rows re-base on 70; the hidden row keeps its original 30%.
    const percentages = getStackedLegendPercentages(container);
    expect(percentages[0]).toBeCloseTo(85.7, 1);
    expect(percentages[1]).toBe(30);
    expect(percentages[2]).toBeCloseTo(14.3, 1);
    expect(percentages[0]! + percentages[2]!).toBeCloseTo(100, 0);
  });

  it("keeps every swatch on its original color when an item is hidden", () => {
    const { container, rerender } = renderLegend();

    const colorsBefore = getStackedLegendColors(container);

    rerender(<StackedLegend items={[items[0]!, { ...items[1]!, hidden: true }, items[2]!]} />);

    expect(getStackedLegendColors(container)).toEqual(colorsBefore);
  });

  it("does not hover-activate a hidden item", () => {
    const onItemHover = vi.fn();
    const onLegendItemHover = vi.fn();
    const { container } = render(
      <StackedLegend
        items={[items[0]!, { ...items[1]!, hidden: true }, items[2]!]}
        layout="scrollable"
        onItemHover={onItemHover}
        onLegendItemHover={onLegendItemHover}
      />,
    );

    const [visible, hidden] = getStackedLegendItems(container);

    fireEvent.mouseEnter(hidden!);
    expect(onItemHover).not.toHaveBeenCalled();
    expect(onLegendItemHover).not.toHaveBeenCalled();

    fireEvent.mouseEnter(visible!);
    expect(onItemHover).toHaveBeenCalledWith("sales");
    expect(onLegendItemHover).toHaveBeenCalledWith(0);
  });

  it("never marks a hidden item as hover-active", () => {
    const { container } = renderLegend({
      items: [items[0]!, { ...items[1]!, hidden: true }, items[2]!],
      activeKey: "revenue",
    });

    expect(getStackedLegendItems(container)[1]?.className).not.toContain(
      "openui-stacked-legend__item--active",
    );
  });
});
