import type { Meta, StoryObj } from "@storybook/react";
import { Card } from "../../../Card";
import { AreaChartCondensed } from "../../AreaChartCondensed/AreaChartCondensed";
import { AreaChart, AreaChartProps } from "../AreaChart";

/** Area charts always stack, so hiding a band has to shrink the stack total. */
const stackedData = [
  { month: "January", desktop: 4_200, mobile: 2_400, tablet: 1_100 },
  { month: "February", desktop: 5_100, mobile: 2_900, tablet: 1_400 },
  { month: "March", desktop: 4_800, mobile: 3_600, tablet: 1_250 },
  { month: "April", desktop: 6_300, mobile: 3_100, tablet: 1_900 },
  { month: "May", desktop: 5_900, mobile: 4_200, tablet: 2_100 },
  { month: "June", desktop: 7_100, mobile: 4_800, tablet: 2_400 },
];

const meta: Meta<typeof AreaChart> = {
  title: "Components/Charts/AreaChart/InteractiveLegend",
  component: AreaChart,
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
type Story = StoryObj<AreaChartProps<typeof stackedData>>;

/**
 * Click to toggle, double click to isolate. Watch the Y axis rescale as bands
 * leave the stack.
 */
export const Stacked: Story = {
  args: {
    data: stackedData,
    categoryKey: "month",
  },
};

/** The opt-out: a plain, non-interactive legend. */
export const NonInteractive: Story = {
  args: {
    data: stackedData,
    categoryKey: "month",
    interactiveLegend: false,
  },
};

/** The condensed variant behaves identically. */
export const Condensed: StoryObj<typeof AreaChartCondensed> = {
  render: () => <AreaChartCondensed data={stackedData} categoryKey="month" />,
};
