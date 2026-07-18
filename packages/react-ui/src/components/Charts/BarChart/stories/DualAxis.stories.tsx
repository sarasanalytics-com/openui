import type { Meta, StoryObj } from "@storybook/react";
import { Card } from "../../../Card";
import { BarChart, BarChartProps } from "../BarChart";

/**
 * Deliberately mismatched scales: `revenue` spans millions, `conversionRate`
 * spans 0.02–0.9. On a single axis the rate bars would be invisible.
 */
const mismatchedScaleData = [
  { month: "January", revenue: 1_000_000, conversionRate: 0.02 },
  { month: "February", revenue: 2_400_000, conversionRate: 0.31 },
  { month: "March", revenue: 1_800_000, conversionRate: 0.18 },
  { month: "April", revenue: 3_600_000, conversionRate: 0.55 },
  { month: "May", revenue: 3_100_000, conversionRate: 0.42 },
  { month: "June", revenue: 5_200_000, conversionRate: 0.68 },
  { month: "July", revenue: 4_400_000, conversionRate: 0.6 },
  { month: "August", revenue: 6_800_000, conversionRate: 0.81 },
  { month: "September", revenue: 6_100_000, conversionRate: 0.74 },
  { month: "October", revenue: 8_000_000, conversionRate: 0.9 },
  { month: "November", revenue: 7_300_000, conversionRate: 0.85 },
  { month: "December", revenue: 7_900_000, conversionRate: 0.88 },
];

/** Three series: two on the left, one on the right. */
const threeSeriesData = mismatchedScaleData.map((row) => ({
  ...row,
  costs: row.revenue * 0.62,
}));

const currencyFormatter = (value: number) => {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value}`;
};

const percentFormatter = (value: number) => `${(value * 100).toFixed(0)}%`;

const meta: Meta<typeof BarChart> = {
  title: "Components/Charts/BarChart/DualAxis",
  component: BarChart,
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
type Story = StoryObj<BarChartProps<typeof mismatchedScaleData>>;

/**
 * The core case: grouped bars, revenue on the left axis in $-compact,
 * conversion rate on the right axis in percent.
 */
export const DualAxis: Story = {
  args: {
    data: mismatchedScaleData,
    categoryKey: "month",
    variant: "grouped",
    secondaryDataKeys: ["conversionRate"],
    yAxisTickFormatter: currencyFormatter,
    secondaryYAxisTickFormatter: percentFormatter,
  },
};

/** Two series left, one right — checks the left domain covers both left keys. */
export const DualAxisMultiplePrimary: Story = {
  args: {
    data: threeSeriesData,
    categoryKey: "month",
    variant: "grouped",
    secondaryDataKeys: ["conversionRate"],
    yAxisTickFormatter: currencyFormatter,
    secondaryYAxisTickFormatter: percentFormatter,
  },
};

/**
 * Stacked bars ignore `secondaryDataKeys` entirely — a stack split across two
 * domains would be meaningless. Must render as a normal single-axis stack.
 */
export const StackedIgnoresSecondaryKeys: Story = {
  args: {
    data: mismatchedScaleData,
    categoryKey: "month",
    variant: "stacked",
    secondaryDataKeys: ["conversionRate"],
    yAxisTickFormatter: currencyFormatter,
    secondaryYAxisTickFormatter: percentFormatter,
  },
};

/**
 * Degenerate input: every key marked secondary. Dual mode must NOT engage.
 */
export const AllKeysSecondaryFallsBackToSingleAxis: Story = {
  args: {
    data: mismatchedScaleData,
    categoryKey: "month",
    variant: "grouped",
    secondaryDataKeys: ["revenue", "conversionRate"],
    yAxisTickFormatter: currencyFormatter,
    secondaryYAxisTickFormatter: percentFormatter,
  },
};

/** Baseline for visual diffing: same data, no secondary axis at all. */
export const SingleAxisBaseline: Story = {
  args: {
    data: mismatchedScaleData,
    categoryKey: "month",
    variant: "grouped",
    yAxisTickFormatter: currencyFormatter,
  },
};
