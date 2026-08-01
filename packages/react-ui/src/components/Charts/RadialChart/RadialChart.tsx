import clsx from "clsx";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Cell, PolarGrid, RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";
import { usePrintContext } from "../../../context/PrintContext";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../Charts";
import {
  useCategoryVisibility,
  useExportChartData,
  useTransformedKeys,
  type SeriesVisibilityChange,
} from "../hooks";
import { DefaultLegend } from "../shared/DefaultLegend/DefaultLegend";
import { StackedLegend } from "../shared/StackedLegend/StackedLegend";
import { LegendItem } from "../types/Legend";
import { getCategoricalChartConfig } from "../utils/dataUtils";
import { PaletteName, useChartPalette } from "../utils/PalletUtils";
import { RadialChartData } from "./types";
import {
  calculateRadialChartDimensions,
  createRadialAnimationConfig,
  createRadialEventHandlers,
  getRadialHoverStyles,
  transformRadialDataWithPercentages,
  useRadialChartHover,
} from "./utils/RadialChartUtils";

export interface RadialChartProps<T extends RadialChartData> {
  data: T;
  categoryKey: keyof T[number];
  dataKey: keyof T[number];
  theme?: PaletteName;
  customPalette?: string[];
  variant?: "semicircle" | "circular";
  format?: "percentage" | "number";
  legend?: boolean;
  legendVariant?: "default" | "stacked";
  grid?: boolean;
  isAnimationActive?: boolean;
  cornerRadius?: number;
  onMouseEnter?: (data: any, index: number) => void;
  onMouseLeave?: () => void;
  onClick?: (data: any, index: number) => void;
  className?: string;
  maxChartSize?: number;
  minChartSize?: number;
  height?: number | string;
  width?: number | string;
  /**
   * Legend click hides/shows a category and double click isolates it. Percentages
   * re-base on the visible categories. Set to `false` for a plain, static legend.
   */
  interactiveLegend?: boolean;
  /**
   * Notified after a legend interaction changed which categories are visible.
   * Guarded no-ops are not reported; a double click emits `hide`, `show` and
   * then `isolate`.
   */
  onSeriesVisibilityChange?: (change: SeriesVisibilityChange) => void;
}

const STACKED_LEGEND_BREAKPOINT = 400;
const MIN_CHART_SIZE = 150;
const MAX_CHART_SIZE = 500;

export const RadialChart = <T extends RadialChartData>({
  data,
  categoryKey,
  dataKey,
  theme = "ocean",
  customPalette,
  variant = "circular",
  format = "number",
  legend = true,
  legendVariant = "stacked",
  grid = false,
  isAnimationActive = false,
  cornerRadius = 10,
  onMouseEnter,
  onMouseLeave,
  onClick,
  className,
  maxChartSize = MAX_CHART_SIZE,
  minChartSize = MIN_CHART_SIZE,
  height,
  width,
  interactiveLegend = true,
  onSeriesVisibilityChange,
}: RadialChartProps<T>) => {
  const printContext = usePrintContext();
  isAnimationActive = printContext ? false : isAnimationActive;

  const wrapperRef = useRef<HTMLDivElement>(null);
  const [wrapperRect, setWrapperRect] = useState({ width: 0, height: 0 });
  const [hoveredLegendKey, setHoveredLegendKey] = useState<string | null>(null);
  const [isLegendExpanded, setIsLegendExpanded] = useState(false);
  const { activeIndex, handleMouseEnter, handleMouseLeave } = useRadialChartHover();

  // Determine layout mode based on container width
  const isRowLayout =
    legend && legendVariant === "stacked" && wrapperRect.width >= STACKED_LEGEND_BREAKPOINT;

  // Sort data by value (highest to lowest) for radial chart rendering
  const sortedProcessedData = useMemo(
    () => [...data].sort((a, b) => Number(b[dataKey]) - Number(a[dataKey])),
    [data, dataKey],
  );

  const categories = useMemo(
    () => sortedProcessedData.map((item) => String(item[categoryKey])),
    [sortedProcessedData, categoryKey],
  );
  const transformedKeys = useTransformedKeys(categories);

  // Visibility is tracked per legend ROW, not per category name: two categories
  // can legitimately carry the same label, and they must toggle (and stay
  // colored) independently. Keys are index-disambiguated over the sorted order.
  const rowKeys = useMemo(
    () => categories.map((category, index) => `${category}-${index}`),
    [categories],
  );

  // Memoize string conversions to avoid repeated calls
  const categoryKeyString = useMemo(() => String(categoryKey), [categoryKey]);
  const dataKeyString = useMemo(() => String(dataKey), [dataKey]);
  const formatKey = useMemo(
    () => (format === "percentage" ? "percentage" : dataKeyString),
    [format, dataKeyString],
  );

  // Use provided dimensions or observed dimensions from the wrapper
  const effectiveWidth = wrapperRect.width;
  const effectiveHeight = wrapperRect.height;

  // Calculate chart dimensions based on the smaller dimension of the container
  const chartSize = useMemo(() => {
    // Compute the available width for the chart. In row layout, chart and legend sit side-by-side.
    // Subtract the 20px gap defined in CSS to avoid over-estimating available width.
    const containerWidth = isRowLayout ? Math.max(0, (effectiveWidth - 20) / 2) : effectiveWidth;

    // If wrapper height isn't explicitly provided (or is very small), prefer sizing by width to
    // avoid a feedback loop where height depends on the chart, which then clamps the size.
    const heightIsUsable = effectiveHeight >= minChartSize;

    let size = heightIsUsable ? Math.min(containerWidth, effectiveHeight) : containerWidth;
    size = Math.min(size, maxChartSize);
    return Math.max(minChartSize, size);
  }, [effectiveWidth, effectiveHeight, isRowLayout]);

  const chartSizeStyle = useMemo(
    () => ({
      width: chartSize,
      height: chartSize,
    }),
    [chartSize],
  );

  const rechartsProps: Omit<React.ComponentProps<typeof ResponsiveContainer>, "children"> = useMemo(
    () => ({
      width: "100%",
      height: "100%",
      minWidth: 1,
      minHeight: 1,
      initialDimension: { width: 1, height: 1 },
    }),
    [],
  );

  // Calculate chart radii
  const dimensions = useMemo(() => calculateRadialChartDimensions(chartSize), [chartSize]);

  // Get color palette and distribute colors. Palette length is driven by the FULL
  // category list: colors are assigned positionally, so hiding a category must
  // never shrink this.
  const colors = useChartPalette({
    chartThemeName: theme,
    customPalette,
    themePaletteName: "radialChartPalette",
    dataLength: sortedProcessedData.length,
  });

  const { hiddenKeys, legendInteractionProps } = useCategoryVisibility({
    keys: rowKeys,
    enabled: interactiveLegend,
    // Row keys are an internal detail; the public callback reports the plain
    // category names. Inline arrow is fine: the hook reads this through a ref.
    onVisibilityChange: onSeriesVisibilityChange
      ? (change) => {
          const categoryByRowKey = new Map(rowKeys.map((key, index) => [key, categories[index]!]));
          onSeriesVisibilityChange({
            ...change,
            key: categoryByRowKey.get(change.key) ?? change.key,
            visibleKeys: change.visibleKeys.map((key) => categoryByRowKey.get(key) ?? key),
          });
        }
      : undefined,
  });

  // Indexes (into the sorted list) of the rows that are actually drawn.
  const visibleRowIndexes = useMemo(() => {
    const indexes: number[] = [];
    rowKeys.forEach((key, index) => {
      if (!hiddenKeys.has(key)) indexes.push(index);
    });
    return indexes;
  }, [rowKeys, hiddenKeys]);

  const visibleData = useMemo(
    () => visibleRowIndexes.map((index) => sortedProcessedData[index]!),
    [sortedProcessedData, visibleRowIndexes],
  );

  // `transformRadialDataWithPercentages` assigns `fill` positionally from the
  // array it is handed, so it gets colors aligned to the VISIBLE rows. Colors
  // stay positional over the FULL row list, so hiding a category never recolors
  // the survivors and duplicate names keep their own color.
  const visibleColors = useMemo(
    () => visibleRowIndexes.map((index) => colors[index] || "#000000"),
    [visibleRowIndexes, colors],
  );

  const exportData = useExportChartData({
    type: "pie",
    data: sortedProcessedData,
    categoryKey: categoryKey as string,
    dataKeys: [dataKey as string],
    colors,
    legend,
  });

  // Only the visible categories are transformed, so the percentages re-sum to 100
  // over what is actually drawn.
  const transformedData = useMemo(
    () => transformRadialDataWithPercentages(visibleData as T, dataKey, visibleColors),
    [visibleData, dataKey, visibleColors],
  );

  const chartConfig = useMemo(
    () => getCategoricalChartConfig(sortedProcessedData as T, categoryKey, colors, transformedKeys),
    [sortedProcessedData, categoryKey, colors, transformedKeys],
  );

  const animationConfig = useMemo(
    () => createRadialAnimationConfig({ isAnimationActive }),
    [isAnimationActive],
  );

  const eventHandlers = useMemo(
    () => createRadialEventHandlers(onMouseEnter, onMouseLeave, onClick),
    [onMouseEnter, onMouseLeave, onClick],
  );

  // Create legend items for both variants. They cover EVERY category (hidden ones
  // included, flagged + dimmed) so a hidden category can be brought back.
  const legendItems = useMemo(
    () =>
      sortedProcessedData.map((item, index) => {
        const rowKey = rowKeys[index]!;
        return {
          key: rowKey,
          label: String(item[categoryKey]),
          value: Number(item[dataKey]),
          color: colors[index] || "#000000",
          hidden: hiddenKeys.has(rowKey),
        };
      }),
    [sortedProcessedData, categoryKey, dataKey, colors, hiddenKeys, rowKeys],
  );

  const defaultLegendItems = useMemo((): LegendItem[] => {
    return legendItems.map(({ key, label, color, hidden }) => ({ key, label, color, hidden }));
  }, [legendItems]);

  // Handle legend item hover to highlight radial bar
  const handleLegendItemHover = useCallback(
    (index: number | null) => {
      if (legendVariant !== "stacked") return;
      if (index !== null) {
        const rowKey = rowKeys[index];
        if (rowKey !== undefined) {
          setHoveredLegendKey(rowKey);
          // Matched by row, not by name: two categories can share a label.
          const transformedIndex = visibleRowIndexes.indexOf(index);
          if (transformedIndex !== -1) {
            handleMouseEnter(transformedData[transformedIndex], transformedIndex);
          }
        }
      } else {
        setHoveredLegendKey(null);
        handleMouseLeave();
      }
    },
    [
      rowKeys,
      visibleRowIndexes,
      transformedData,
      handleMouseEnter,
      handleMouseLeave,
      legendVariant,
    ],
  );

  // Enhanced chart hover handlers
  const handleChartMouseEnter = useCallback(
    (entry: any, index: number) => {
      handleMouseEnter(entry, index);
      if (legend && legendVariant === "stacked") {
        // `index` is the position in the RENDERED data, so it has to be mapped
        // back onto the legend row it came from.
        const rowIndex = visibleRowIndexes[index];
        setHoveredLegendKey(rowIndex === undefined ? null : (rowKeys[rowIndex] ?? null));
      }
      eventHandlers.onMouseEnter?.(entry, index);
    },
    [
      handleMouseEnter,
      legend,
      legendVariant,
      eventHandlers.onMouseEnter,
      rowKeys,
      visibleRowIndexes,
    ],
  );

  const handleChartMouseLeave = useCallback(() => {
    handleMouseLeave();
    if (legend && legendVariant === "stacked") {
      setHoveredLegendKey(null);
    }
    eventHandlers.onMouseLeave?.();
  }, [handleMouseLeave, legend, legendVariant, eventHandlers.onMouseLeave]);

  // Setup ResizeObserver to watch the wrapper element
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    // Use ResizeObserver if component is in responsive mode (no fixed width/height)
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setWrapperRect({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []);

  const renderLegend = useCallback(() => {
    if (!legend) return null;
    if (legendVariant === "stacked") {
      return (
        <div className="openui-radial-chart-legend-container">
          <StackedLegend
            items={legendItems}
            onItemHover={setHoveredLegendKey}
            activeKey={hoveredLegendKey}
            onLegendItemHover={handleLegendItemHover}
            containerWidth={isRowLayout ? undefined : wrapperRect.width}
            {...legendInteractionProps}
          />
        </div>
      );
    }
    return (
      <DefaultLegend
        items={defaultLegendItems}
        containerWidth={wrapperRect.width}
        isExpanded={isLegendExpanded}
        setIsExpanded={setIsLegendExpanded}
        {...legendInteractionProps}
      />
    );
  }, [
    legend,
    legendVariant,
    legendItems,
    hoveredLegendKey,
    handleLegendItemHover,
    wrapperRect.width,
    isRowLayout,
    defaultLegendItems,
    isLegendExpanded,
    legendInteractionProps,
  ]);

  const wrapperClassName = clsx("openui-radial-chart-container-wrapper", className, {
    "layout-row": isRowLayout,
    "layout-column": !isRowLayout,
    "legend-default": legend && legendVariant === "default",
    "legend-stacked": legend && legendVariant === "stacked",
  });

  // Correct angles for semicircle (top half)
  const startAngle = variant === "semicircle" ? 180 : 0;
  const endAngle = variant === "semicircle" ? 0 : 360;

  const wrapperStyle = useMemo(() => {
    const formatDimension = (value: number | string | undefined) => {
      if (typeof value === "number") {
        return `${value}px`;
      }
      return value;
    };
    const dimensions = {
      width: formatDimension(width),
      height: formatDimension(height),
    };

    if (dimensions.width === undefined) {
      delete dimensions.width;
    }

    if (dimensions.height === undefined) {
      delete dimensions.height;
    }
    return dimensions;
  }, [width, height]);

  return (
    <div
      ref={wrapperRef}
      className={wrapperClassName}
      style={wrapperStyle}
      aria-description="radial-chart-wrapper"
      data-openui-chart={exportData}
    >
      <div className="openui-radial-chart-container">
        <div className="openui-radial-chart-container-inner">
          <div style={chartSizeStyle}>
            <ChartContainer
              config={chartConfig}
              className="openui-radial-chart"
              rechartsProps={rechartsProps}
            >
              <RadialBarChart
                data={transformedData}
                startAngle={startAngle}
                endAngle={endAngle}
                innerRadius={dimensions.innerRadius}
                outerRadius={dimensions.outerRadius}
              >
                {grid && <PolarGrid gridType="circle" />}
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      showPercentage={format === "percentage"}
                      nameKey={categoryKeyString}
                    />
                  }
                />
                <RadialBar
                  dataKey={formatKey}
                  background={!grid}
                  cornerRadius={cornerRadius}
                  {...animationConfig}
                  activeIndex={activeIndex ?? undefined}
                  onMouseEnter={handleChartMouseEnter}
                  onMouseLeave={handleChartMouseLeave}
                  onClick={eventHandlers.onClick}
                >
                  {transformedData.map((_entry, index) => {
                    const hoverStyles = getRadialHoverStyles(index, activeIndex);
                    // Keyed on the ROW the bar came from, never on the rendered
                    // index alone: hiding a category must not recolor the
                    // survivors, and two rows sharing a label keep distinct colors.
                    const fill = visibleColors[index];
                    return (
                      <Cell key={`cell-${index}`} fill={fill} {...hoverStyles} stroke="none" />
                    );
                  })}
                </RadialBar>
              </RadialBarChart>
            </ChartContainer>
          </div>
        </div>
      </div>
      {renderLegend()}
    </div>
  );
};
