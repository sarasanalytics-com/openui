import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { useSeriesVisibility } from "../../../hooks/useSeriesVisibility";
import { LegendItem } from "../../../types";
import { DefaultLegend } from "../DefaultLegend";

const meta: Meta<typeof DefaultLegend> = {
  title: "Components/Charts/Shared/InteractiveLegend",
  component: DefaultLegend,
  parameters: {
    layout: "centered",
  },
  tags: ["!dev", "!autodocs"],
  argTypes: {
    containerWidth: {
      control: { type: "range", min: 200, max: 800, step: 50 },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const seriesColors: Record<string, string> = {
  sales: "#3b82f6",
  marketing: "#ef4444",
  revenue: "#10b981",
  conversion: "#f59e0b",
  retention: "#8b5cf6",
};

const seriesLabels: Record<string, string> = {
  sales: "Sales Data",
  marketing: "Marketing Leads",
  revenue: "Total Revenue",
  conversion: "Conversion Rate",
  retention: "User Retention",
};

const dataKeys = Object.keys(seriesColors);

const InteractiveLegendExample = ({ containerWidth }: { containerWidth?: number }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { visibleKeys, isHidden, toggle, isolate, showAll } = useSeriesVisibility(dataKeys);

  const items: LegendItem[] = dataKeys.map((key) => ({
    key,
    label: seriesLabels[key] ?? key,
    color: seriesColors[key] ?? "#000000",
    hidden: isHidden(key),
  }));

  return (
    <div style={{ width: "100%", padding: "20px", display: "grid", gap: "16px" }}>
      <p style={{ margin: 0, fontSize: "14px", color: "#666" }}>
        <strong>Click</strong> a legend item to hide or show that series.{" "}
        <strong>Double click</strong> to isolate it (double click again to restore all). The last
        visible series cannot be hidden.
      </p>

      <div
        style={{
          border: "1px dashed #ccc",
          padding: "16px",
          borderRadius: "8px",
        }}
      >
        <DefaultLegend
          items={items}
          containerWidth={containerWidth}
          isExpanded={isExpanded}
          setIsExpanded={setIsExpanded}
          onItemClick={toggle}
          onItemDoubleClick={isolate}
          xAxisLabel="Month"
          yAxisLabel="Value"
        />
      </div>

      <div style={{ fontSize: "13px", color: "#444" }}>
        Visible series ({visibleKeys.length}/{dataKeys.length}):{" "}
        <strong>{visibleKeys.join(", ")}</strong>
      </div>

      <div>
        <button type="button" onClick={showAll} style={{ fontSize: "13px", padding: "4px 10px" }}>
          Show all
        </button>
      </div>
    </div>
  );
};

export const Interactive: Story = {
  args: {
    containerWidth: 600,
  },
  render: (args: any) => <InteractiveLegendExample containerWidth={args.containerWidth} />,
};
