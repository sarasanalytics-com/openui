import type { Meta, StoryObj } from "@storybook/react";
import { Card } from "../../../Card";
import { SingleStackedBar, SingleStackedBarProps } from "../SingleStackedBarChart";

/**
 * Click a legend item to hide that segment, click again to bring it back. Double
 * click to isolate a single segment; double click the isolated one to restore
 * everything. The chart never lets you hide the last visible segment.
 *
 * Hidden segments leave the bar entirely and the remaining widths recompute so
 * the bar still fills 100%, while the palette stays keyed to the full segment
 * list so the survivors never change color.
 */
const funnelData = [
  { stage: "Awareness", users: 42_000 },
  { stage: "Interest", users: 24_000 },
  { stage: "Consideration", users: 11_000 },
  { stage: "Intent", users: 8_000 },
  { stage: "Purchase", users: 5_000 },
];

const meta: Meta<typeof SingleStackedBar> = {
  title: "Components/Charts/SingleStackedBar/InteractiveLegend",
  component: SingleStackedBar,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <Card style={{ width: "650px", padding: "24px" }}>
        <Story />
      </Card>
    ),
  ],
};

export default meta;
type Story = StoryObj<SingleStackedBarProps<typeof funnelData>>;

/** The default (bottom) legend. Toggle and isolate from it. */
export const DefaultLegendVariant: Story = {
  args: {
    data: funnelData,
    categoryKey: "stage",
    dataKey: "users",
    legendVariant: "default",
  },
};

/** The stacked legend drives exactly the same visibility state. */
export const StackedLegendVariant: Story = {
  args: {
    data: funnelData,
    categoryKey: "stage",
    dataKey: "users",
    legendVariant: "stacked",
  },
};

/** The opt-out: a plain, non-interactive legend. */
export const NonInteractive: Story = {
  args: {
    data: funnelData,
    categoryKey: "stage",
    dataKey: "users",
    legendVariant: "default",
    interactiveLegend: false,
  },
};
