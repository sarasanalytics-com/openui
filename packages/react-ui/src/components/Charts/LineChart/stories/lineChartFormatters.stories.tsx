import type { Meta, StoryObj } from "@storybook/react";
import { Card } from "../../../Card";
import { LineChart, LineChartProps } from "../LineChart";

const revenueData = [
  { month: "Jan", revenue: 68.7, cost: 42.3 },
  { month: "Feb", revenue: 92.4, cost: 51.1 },
  { month: "Mar", revenue: 110.2, cost: 60.8 },
  { month: "Apr", revenue: 98.6, cost: 55.4 },
  { month: "May", revenue: 134.9, cost: 71.2 },
  { month: "Jun", revenue: 156.3, cost: 80.5 },
];

const currency = (value: number) => `$${value.toFixed(2)}`;

const meta: Meta<LineChartProps<typeof revenueData>> = {
  title: "Components/Charts/LineChartFormatters",
  component: LineChart,
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
      <LineChart
        data={revenueData}
        categoryKey="month"
        yAxisTickFormatter={currency}
        tooltipValueFormatter={(value) =>
          typeof value === "number" ? currency(value) : String(value)
        }
      />
    </Card>
  ),
};
