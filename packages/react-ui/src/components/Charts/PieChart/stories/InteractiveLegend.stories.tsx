import type { Meta, StoryObj } from "@storybook/react";
import { Card } from "../../../Card";
import { PieChart, PieChartProps } from "../PieChart";

/**
 * Click a legend row to hide that slice, click again to bring it back. Double
 * click to isolate a single slice; double click the isolated one to restore
 * everything. The chart never lets you hide the last visible slice.
 *
 * Hidden slices leave the pie entirely and the percentages re-sum to 100 over
 * what is left, while the palette stays keyed to the full category list so the
 * surviving slices never change color.
 */
const channelData = [
  { channel: "Organic search", visits: 42_000 },
  { channel: "Paid search", visits: 24_000 },
  { channel: "Referral", visits: 11_000 },
  { channel: "Email", visits: 8_000 },
  { channel: "Social", visits: 5_000 },
];

const meta: Meta<typeof PieChart> = {
  title: "Components/Charts/PieChart/InteractiveLegend",
  component: PieChart,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <Card style={{ width: "700px", height: "360px", padding: "16px" }}>
        <Story />
      </Card>
    ),
  ],
};

export default meta;
type Story = StoryObj<PieChartProps<typeof channelData>>;

/** The stacked legend, side by side with the pie. Toggle and isolate from it. */
export const Pie: Story = {
  args: {
    data: channelData,
    categoryKey: "channel",
    dataKey: "visits",
    variant: "pie",
    legendVariant: "stacked",
  },
};

/** The donut variant. Both rings drop out together when a slice is hidden. */
export const Donut: Story = {
  args: {
    data: channelData,
    categoryKey: "channel",
    dataKey: "visits",
    variant: "donut",
    legendVariant: "stacked",
  },
};

/** The default (bottom) legend drives exactly the same visibility state. */
export const DefaultLegendVariant: Story = {
  args: {
    data: channelData,
    categoryKey: "channel",
    dataKey: "visits",
    variant: "pie",
    legendVariant: "default",
  },
};

/** The opt-out: a plain, non-interactive legend. */
export const NonInteractive: Story = {
  args: {
    data: channelData,
    categoryKey: "channel",
    dataKey: "visits",
    variant: "pie",
    legendVariant: "stacked",
    interactiveLegend: false,
  },
};
