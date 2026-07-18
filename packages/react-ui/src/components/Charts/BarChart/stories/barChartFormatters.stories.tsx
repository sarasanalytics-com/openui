import type { Meta, StoryObj } from "@storybook/react";
import { Card } from "../../../Card";
import { BarChart, BarChartProps } from "../BarChart";

const revenueData = [
  { quarter: "Q1", revenue: 68.7, cost: 42.3 },
  { quarter: "Q2", revenue: 92.4, cost: 51.1 },
  { quarter: "Q3", revenue: 110.2, cost: 60.8 },
  { quarter: "Q4", revenue: 156.3, cost: 80.5 },
];

const currency = (value: number) => `$${value.toFixed(2)}`;

const meta: Meta<BarChartProps<typeof revenueData>> = {
  title: "Components/Charts/BarChartFormatters",
  component: BarChart,
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Demonstrates `yAxisTickFormatter` (currency Y-axis ticks) and
 * `tooltipValueFormatter` (per-series currency values in the tooltip).
 */
export const CurrencyFormatters: Story = {
  render: () => (
    <Card style={{ width: 640, padding: 16 }}>
      <BarChart
        data={revenueData}
        categoryKey="quarter"
        yAxisTickFormatter={currency}
        tooltipValueFormatter={(value) =>
          typeof value === "number" ? currency(value) : String(value)
        }
      />
    </Card>
  ),
};
