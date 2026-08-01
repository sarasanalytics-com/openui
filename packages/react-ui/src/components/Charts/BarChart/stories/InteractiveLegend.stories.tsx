import type { Meta, StoryObj } from "@storybook/react";
import { Card } from "../../../Card";
import { BarChart, BarChartProps } from "../BarChart";

/**
 * Click a legend item to hide that series, click again to bring it back.
 * Double click to isolate a single series; double click the isolated one to
 * restore everything. The chart never lets you hide the last visible series,
 * and hidden series drop out of the axis domain so the rest rescale.
 */
const channelData = [
  { month: "January", organic: 4_200, paid: 2_400, referral: 1_100, email: 800 },
  { month: "February", organic: 5_100, paid: 2_900, referral: 1_400, email: 950 },
  { month: "March", organic: 4_800, paid: 3_600, referral: 1_250, email: 1_200 },
  { month: "April", organic: 6_300, paid: 3_100, referral: 1_900, email: 1_050 },
  { month: "May", organic: 5_900, paid: 4_200, referral: 2_100, email: 1_400 },
  { month: "June", organic: 7_100, paid: 4_800, referral: 2_400, email: 1_650 },
];

/** Two series in the thousands, one a 0–1 rate — the dual-axis case. */
const dualAxisData = channelData.map((row) => ({
  month: row.month,
  organic: row.organic,
  paid: row.paid,
  conversionRate: Math.round((row.email / row.organic) * 1000) / 1000,
}));

const percentFormatter = (value: number) => `${(value * 100).toFixed(1)}%`;

const meta: Meta<typeof BarChart> = {
  title: "Components/Charts/BarChart/InteractiveLegend",
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
type Story = StoryObj<BarChartProps<typeof channelData>>;

/** Grouped bars, four series. Toggle and isolate from the legend. */
export const Grouped: Story = {
  args: {
    data: channelData,
    categoryKey: "month",
    variant: "grouped",
  },
};

/**
 * Stacked bars. Hiding the top series has to move the rounded cap down onto the
 * new top bar, and the stack total has to shrink.
 */
export const Stacked: Story = {
  args: {
    data: channelData,
    categoryKey: "month",
    variant: "stacked",
  },
};

/**
 * Dual axis. Hiding a left-axis series rescales only the left axis; the chart
 * keeps rendering even when every left-axis series is hidden.
 */
export const DualAxis: StoryObj<BarChartProps<typeof dualAxisData>> = {
  args: {
    data: dualAxisData,
    categoryKey: "month",
    variant: "grouped",
    secondaryDataKeys: ["conversionRate"],
    secondaryYAxisTickFormatter: percentFormatter,
  },
};

/** The opt-out: a plain, non-interactive legend. */
export const NonInteractive: Story = {
  args: {
    data: channelData,
    categoryKey: "month",
    variant: "grouped",
    interactiveLegend: false,
  },
};
