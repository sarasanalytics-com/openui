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

/**
 * The interactive row for an item, matched on its accessible name — which is the
 * row's own text (label + percentage), since the rows carry no `aria-label`.
 */
const getRow = (label: string) => screen.getByRole("button", { name: new RegExp(`^${label}\\b`) });

describe("StackedLegend", () => {
  it("is not interactive without onItemClick", () => {
    const { container } = renderLegend();

    expect(screen.queryByRole("button")).toBeNull();
    const [first] = getStackedLegendItems(container);
    expect(first?.getAttribute("tabindex")).toBeNull();
    expect(first?.getAttribute("data-interactive")).toBeNull();
  });

  it("renders an interactive row per item when onItemClick is provided", () => {
    renderLegend({ onItemClick: () => {} });

    const rows = screen.getAllByRole("button");
    expect(rows).toHaveLength(items.length);
    expect(rows[0]?.getAttribute("tabindex")).toBe("0");
    // No aria-label: the row's own text (label + percentage) is the accessible
    // name, so a screen reader announces what is actually on screen.
    expect(rows[0]?.getAttribute("aria-label")).toBeNull();
    expect(rows[0]?.textContent).toBe("Sales60.0%");
    expect(rows[0]?.getAttribute("data-interactive")).toBe("true");
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

  it("reflects hidden state via aria-pressed and the dimming attribute", () => {
    renderLegend({
      items: [items[0]!, { ...items[1]!, hidden: true }, items[2]!],
      onItemClick: () => {},
    });

    expect(getRow("Sales").getAttribute("aria-pressed")).toBe("true");
    expect(getRow("Sales").getAttribute("data-hidden")).toBeNull();

    expect(getRow("Revenue").getAttribute("aria-pressed")).toBe("false");
    expect(getRow("Revenue").getAttribute("data-hidden")).toBe("true");
  });

  it("marks hidden items even without interactivity", () => {
    const { container } = renderLegend({
      items: [items[0]!, { ...items[1]!, hidden: true }, items[2]!],
    });

    expect(getStackedLegendItems(container)[1]?.getAttribute("data-hidden")).toBe("true");
  });

  it("isolates on Shift+Enter and Shift+Space", () => {
    const onItemClick = vi.fn();
    const onItemDoubleClick = vi.fn();
    renderLegend({ onItemClick, onItemDoubleClick });

    fireEvent.keyDown(getRow("Sales"), { key: "Enter", shiftKey: true });
    fireEvent.keyDown(getRow("Sales"), { key: " ", shiftKey: true });

    expect(onItemDoubleClick).toHaveBeenCalledTimes(2);
    expect(onItemDoubleClick).toHaveBeenNthCalledWith(1, "sales");
    expect(onItemClick).not.toHaveBeenCalled();
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
