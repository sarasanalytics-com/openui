import type { Meta, StoryObj } from "@storybook/react";
import { Card } from "../../../Card";
import { LineChart, LineChartProps } from "../LineChart";

/**
 * Two series in the millions on the left axis, one 0–1 rate on the right.
 * Hiding a left-axis series rescales only the left axis.
 */
const dualAxisData = [
  { month: "January", revenue: 1_000_000, costs: 620_000, conversionRate: 0.02 },
  { month: "February", revenue: 2_400_000, costs: 1_480_000, conversionRate: 0.31 },
  { month: "March", revenue: 1_800_000, costs: 1_120_000, conversionRate: 0.18 },
  { month: "April", revenue: 3_600_000, costs: 2_230_000, conversionRate: 0.55 },
  { month: "May", revenue: 3_100_000, costs: 1_920_000, conversionRate: 0.42 },
  { month: "June", revenue: 5_200_000, costs: 3_220_000, conversionRate: 0.68 },
];

const currencyFormatter = (value: number) => `$${(value / 1_000_000).toFixed(1)}M`;
const percentFormatter = (value: number) => `${(value * 100).toFixed(0)}%`;

const meta: Meta<typeof LineChart> = {
  title: "Components/Charts/LineChart/InteractiveLegend",
  component: LineChart,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <Card style={{ width: "800px", padding: "16px" }}>
        <Story />
      </Card>
    ),
  ],
};

export default meta;
type Story = StoryObj<LineChartProps<typeof dualAxisData>>;

/**
 * Click to toggle, double click to isolate. Hide both left-axis series and the
 * chart still renders — the hidden axes stay mounted.
 */
export const DualAxis: Story = {
  args: {
    data: dualAxisData,
    categoryKey: "month",
    secondaryDataKeys: ["conversionRate"],
    yAxisTickFormatter: currencyFormatter,
    secondaryYAxisTickFormatter: percentFormatter,
  },
};

/** The opt-out: a plain, non-interactive legend. */
export const NonInteractive: Story = {
  args: {
    data: dualAxisData,
    categoryKey: "month",
    secondaryDataKeys: ["conversionRate"],
    yAxisTickFormatter: currencyFormatter,
    secondaryYAxisTickFormatter: percentFormatter,
    interactiveLegend: false,
  },
};
