import type { Meta, StoryObj } from "@storybook/react";
import { Card } from "../../../Card";
import { LineChart, LineChartProps } from "../LineChart";

/**
 * Deliberately mismatched scales: `revenue` spans millions, `conversionRate`
 * spans 0.02–0.9. On a single axis the rate series would be pinned flat to the
 * baseline — the whole point of the secondary axis.
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

/** Wide dataset (24 points) to force horizontal scrolling of the main chart. */
const wideData = Array.from({ length: 24 }, (_, index) => ({
  month: `2025-${String((index % 12) + 1).padStart(2, "0")}`,
  revenue: 1_000_000 + index * 300_000,
  conversionRate: 0.02 + index * 0.036,
}));

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

const meta: Meta<typeof LineChart> = {
  title: "Components/Charts/LineChart/DualAxis",
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
type Story = StoryObj<LineChartProps<typeof mismatchedScaleData>>;

/**
 * The core case: revenue on the left axis in $-compact, conversion rate on the
 * right axis in percent. Both series should span the full plot height against
 * their own axis.
 */
export const DualAxis: Story = {
  args: {
    data: mismatchedScaleData,
    categoryKey: "month",
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
    secondaryDataKeys: ["conversionRate"],
    yAxisTickFormatter: currencyFormatter,
    secondaryYAxisTickFormatter: percentFormatter,
  },
};

/** Wide data — both axes must stay pinned while the plot scrolls. */
export const DualAxisScrollable: Story = {
  args: {
    data: wideData,
    categoryKey: "month",
    secondaryDataKeys: ["conversionRate"],
    yAxisTickFormatter: currencyFormatter,
    secondaryYAxisTickFormatter: percentFormatter,
  },
};

/**
 * Degenerate input: every key marked secondary. Dual mode must NOT engage —
 * this should render identically to a plain single-axis chart.
 */
export const AllKeysSecondaryFallsBackToSingleAxis: Story = {
  args: {
    data: mismatchedScaleData,
    categoryKey: "month",
    secondaryDataKeys: ["revenue", "conversionRate"],
    yAxisTickFormatter: currencyFormatter,
    secondaryYAxisTickFormatter: percentFormatter,
  },
};

/**
 * Degenerate input: secondary key not present in the data. Unknown keys are
 * ignored, so this too renders single-axis.
 */
export const UnknownSecondaryKeyFallsBackToSingleAxis: Story = {
  args: {
    data: mismatchedScaleData,
    categoryKey: "month",
    secondaryDataKeys: ["notARealKey"],
    yAxisTickFormatter: currencyFormatter,
  },
};

/** Baseline for visual diffing: same data, no secondary axis at all. */
export const SingleAxisBaseline: Story = {
  args: {
    data: mismatchedScaleData,
    categoryKey: "month",
    yAxisTickFormatter: currencyFormatter,
  },
};
