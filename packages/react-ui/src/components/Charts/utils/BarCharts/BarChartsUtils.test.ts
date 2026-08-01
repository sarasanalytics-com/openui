import { describe, expect, it } from "vitest";
import { getBarStackInfo } from "./BarChartsUtils";

const payload = { month: "Jan", sales: 10, revenue: 20, costs: 30, margin: 40 };
const allKeys = ["sales", "revenue", "costs", "margin"];

describe("getBarStackInfo with hidden series", () => {
  it("puts the stack cap on the last key of the list it is given", () => {
    const withAllKeys = getBarStackInfo("stacked", 40, "margin", payload, allKeys);
    expect(withAllKeys.isLastInStack).toBe(true);

    const costsWithAllKeys = getBarStackInfo("stacked", 30, "costs", payload, allKeys);
    expect(costsWithAllKeys.isLastInStack).toBe(false);
  });

  it("moves the stack cap to the top VISIBLE bar once a series is hidden", () => {
    // "margin" hidden -> "costs" is now the top of the rendered stack, so the
    // rounded corners must land on it.
    const visibleKeys = ["sales", "revenue", "costs"];

    const costs = getBarStackInfo("stacked", 30, "costs", payload, visibleKeys);
    expect(costs.isLastInStack).toBe(true);
    expect(costs.isFirstInStack).toBe(false);

    const sales = getBarStackInfo("stacked", 10, "sales", payload, visibleKeys);
    expect(sales.isFirstInStack).toBe(true);
    expect(sales.isLastInStack).toBe(false);
  });

  it("rounds both ends when only one series is left visible", () => {
    const only = getBarStackInfo("stacked", 20, "revenue", payload, ["revenue"]);

    expect(only.isFirstInStack).toBe(true);
    expect(only.isLastInStack).toBe(true);
  });

  it("tracks negatives within the visible keys only", () => {
    const mixed = { month: "Jan", sales: -10, revenue: 20, costs: 30 };

    // With "sales" hidden the stack has no negative member any more.
    const withoutNegative = getBarStackInfo("stacked", 30, "costs", mixed, ["revenue", "costs"]);
    expect(withoutNegative.hasNegativeValueInStack).toBe(false);

    const withNegative = getBarStackInfo("stacked", 30, "costs", mixed, [
      "sales",
      "revenue",
      "costs",
    ]);
    expect(withNegative.hasNegativeValueInStack).toBe(true);
  });

  it("ignores the key list entirely for grouped bars", () => {
    expect(getBarStackInfo("grouped", 10, "sales", payload, ["sales"])).toEqual({
      isNegative: false,
    });
  });
});
