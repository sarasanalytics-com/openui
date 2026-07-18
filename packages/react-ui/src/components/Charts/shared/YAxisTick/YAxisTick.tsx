import { useLayoutEffect } from "react";
import { numberTickFormatter } from "../../utils";

interface YAxisTickProps {
  x?: number;
  y?: number;
  payload?: {
    value: any;
    coordinate?: number;
    tickCoord?: number;
    index?: number;
    offset?: number;
    isShow?: boolean;
  };
  textAnchor?: "start" | "middle" | "end";
  verticalAnchor?: "start" | "middle" | "end";
  fill?: string;
  stroke?: string;
  width?: number;
  height?: number;
  className?: string;
  orientation?: "left" | "right";
  tickFormatter?: (value: any) => string;
  index?: number;
  visibleTicksCount?: number;
  setLabelWidth: (label: string) => void;
}

const YAxisTick: React.FC<YAxisTickProps> = (props) => {
  const { x, y, payload, textAnchor, verticalAnchor, className, setLabelWidth, tickFormatter } =
    props;

  // A caller-supplied tickFormatter only receives numeric tick values, so a
  // numeric formatter (e.g. `(v) => "$" + v.toFixed(2)`) is never handed a
  // string. Non-numeric ticks fall back to the default formatting.
  const displayValue =
    tickFormatter && typeof payload?.value === "number"
      ? tickFormatter(payload.value)
      : typeof payload?.value === "number"
        ? numberTickFormatter(payload?.value)
        : String(payload?.value);

  useLayoutEffect(() => {
    setLabelWidth(displayValue);
  }, [displayValue, setLabelWidth]);

  return (
    <g transform={`translate(${x},${y})`} className={className}>
      <text
        x={0}
        y={0}
        dy={verticalAnchor === "middle" ? 4 : 0} // Adjust based on vertical anchor
        textAnchor={textAnchor || "end"}
        className="openui-chart-y-axis-tick"
      >
        {displayValue}
      </text>
    </g>
  );
};

export { YAxisTick };
export type { YAxisTickProps };
