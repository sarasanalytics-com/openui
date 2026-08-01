import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { type LegendItem } from "../../types";
import { DefaultLegend } from "./DefaultLegend";

const items: LegendItem[] = [
  { key: "sales", label: "Sales", color: "#3b82f6" },
  { key: "revenue", label: "Revenue", color: "#ef4444" },
];

const renderLegend = (props: Partial<React.ComponentProps<typeof DefaultLegend>> = {}) =>
  render(<DefaultLegend items={items} isExpanded={false} setIsExpanded={() => {}} {...props} />);

describe("DefaultLegend", () => {
  it("is not interactive without onItemClick", () => {
    renderLegend();

    expect(screen.queryByRole("button")).toBeNull();
    const item = screen.getByText("Sales").closest(".openui-chart-legend-item");
    expect(item?.getAttribute("tabindex")).toBeNull();
    expect(item?.getAttribute("style")).toBeNull();
  });

  it("renders an interactive item per series when onItemClick is provided", () => {
    renderLegend({ onItemClick: () => {} });

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(items.length);
    expect(buttons[0]?.getAttribute("tabindex")).toBe("0");
    expect(buttons[0]?.getAttribute("aria-label")).toBe("Sales; press Enter to toggle series");
    expect(buttons[0]?.style.cursor).toBe("pointer");
  });

  it("fires onItemClick on click, Enter and Space", () => {
    const onItemClick = vi.fn();
    renderLegend({ onItemClick });

    const salesItem = screen.getAllByRole("button")[0]!;

    fireEvent.click(salesItem);
    fireEvent.keyDown(salesItem, { key: "Enter" });
    fireEvent.keyDown(salesItem, { key: " " });

    expect(onItemClick).toHaveBeenCalledTimes(3);
    expect(onItemClick).toHaveBeenNthCalledWith(1, "sales");
    expect(onItemClick).toHaveBeenNthCalledWith(2, "sales");
    expect(onItemClick).toHaveBeenNthCalledWith(3, "sales");
  });

  it("ignores other keys", () => {
    const onItemClick = vi.fn();
    renderLegend({ onItemClick });

    fireEvent.keyDown(screen.getAllByRole("button")[0]!, { key: "a" });

    expect(onItemClick).not.toHaveBeenCalled();
  });

  it("fires onItemDoubleClick on double click", () => {
    const onItemDoubleClick = vi.fn();
    renderLegend({ onItemClick: () => {}, onItemDoubleClick });

    fireEvent.doubleClick(screen.getAllByRole("button")[1]!);

    expect(onItemDoubleClick).toHaveBeenCalledWith("revenue");
  });

  it("reflects hidden state via aria-pressed and dimmed opacity", () => {
    renderLegend({
      items: [items[0]!, { ...items[1]!, hidden: true }],
      onItemClick: () => {},
    });

    const [visible, hidden] = screen.getAllByRole("button");

    expect(visible?.getAttribute("aria-pressed")).toBe("true");
    expect(visible?.style.opacity).toBe("");

    expect(hidden?.getAttribute("aria-pressed")).toBe("false");
    expect(hidden?.style.opacity).toBe("0.3");
  });

  it("dims hidden items even without interactivity", () => {
    renderLegend({ items: [items[0]!, { ...items[1]!, hidden: true }] });

    const hidden = screen.getByText("Revenue").closest(".openui-chart-legend-item");
    expect((hidden as HTMLElement).style.opacity).toBe("0.3");
  });
});
