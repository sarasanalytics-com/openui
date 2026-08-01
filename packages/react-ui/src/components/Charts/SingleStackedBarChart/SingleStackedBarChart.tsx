import clsx from "clsx";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePrintContext } from "../../../context/PrintContext";
import { Separator } from "../../Separator";
import { useCategoryVisibility, useExportChartData } from "../hooks";
import { DefaultLegend } from "../shared/DefaultLegend/DefaultLegend";
import { FloatingUIPortal } from "../shared/PortalTooltip";
import { StackedLegend } from "../shared/StackedLegend/StackedLegend";
import { LegendItem, StackedLegendItem } from "../types";
import { PaletteName, useChartPalette } from "../utils/PalletUtils";
import { ToolTip } from "./components";
import { SingleStackedBarData } from "./types";

export interface SingleStackedBarProps<T extends SingleStackedBarData> {
  data: T;
  categoryKey: keyof T[number];
  dataKey: keyof T[number];
  theme?: PaletteName;
  customPalette?: string[];
  legend?: boolean;
  legendVariant?: "default" | "stacked";
  className?: string;
  style?: React.CSSProperties;
  animated?: boolean;
  /**
   * Legend click hides/shows a segment and double click isolates it. Segment
   * widths and percentages re-base on the visible segments. Set to `false` for a
   * plain, static legend.
   */
  interactiveLegend?: boolean;
}

export const SingleStackedBar = <T extends SingleStackedBarData>({
  data,
  categoryKey,
  dataKey,
  theme = "ocean",
  customPalette,
  legend = true,
  legendVariant = "default",
  className,
  style,
  animated = true,
  interactiveLegend = true,
}: SingleStackedBarProps<T>) => {
  const [isLegendExpanded, setIsLegendExpanded] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [hoveredLegendKey, setHoveredLegendKey] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []);
  // The raw segments, in data order. Never filtered: the palette is positional
  // over this list and legend rows must survive being hidden.
  const segments = useMemo(() => {
    if (!data || data.length === 0) {
      return [];
    }

    return data.map((item, index) => ({
      value: Number(item[dataKey]),
      category: String(item[categoryKey]),
      index,
      key: `${String(item[categoryKey])}-${index}`,
    }));
  }, [data, dataKey, categoryKey]);

  const segmentKeys = useMemo(() => segments.map((segment) => segment.key), [segments]);

  const { hiddenKeys, legendInteractionProps } = useCategoryVisibility({
    keys: segmentKeys,
    enabled: interactiveLegend,
  });

  // Get theme colors for each segment
  const colors = useChartPalette({
    chartThemeName: theme,
    customPalette,
    themePaletteName: "barChartPalette",
    dataLength: Math.max(segments.length, 1),
  });

  // Widths and percentages re-base on the VISIBLE segments, so the bar always
  // fills 100%. A hidden segment keeps reporting its share of the full total,
  // which is what it was before it got hidden. With nothing hidden the two
  // totals are identical, so the rendered output is unchanged.
  const decoratedSegments = useMemo(() => {
    const total = segments.reduce((acc, segment) => acc + segment.value, 0);
    const visibleTotal = segments.reduce(
      (acc, segment) => (hiddenKeys.has(segment.key) ? acc : acc + segment.value),
      0,
    );

    return segments.map((segment) => {
      const hidden = hiddenKeys.has(segment.key);
      const basis = hidden ? total : visibleTotal;
      return {
        ...segment,
        hidden,
        // Colors are positional over the FULL segment list, so hiding one must
        // not recolor the survivors.
        color: colors[segment.index % colors.length] || "",
        percentage: basis > 0 ? (segment.value / basis) * 100 : 0,
      };
    });
  }, [segments, colors, hiddenKeys]);

  const visibleSegments = useMemo(
    () => decoratedSegments.filter((segment) => !segment.hidden),
    [decoratedSegments],
  );

  // Create legend items
  const legendItems = useMemo((): LegendItem[] => {
    return decoratedSegments.map((segment) => ({
      key: segment.key,
      label: segment.category,
      color: segment.color,
      percentage: segment.percentage,
      hidden: segment.hidden,
    }));
  }, [decoratedSegments]);

  // Create stacked legend items with values
  const stackedLegendItems = useMemo(
    (): StackedLegendItem[] =>
      decoratedSegments.map((segment) => ({
        key: segment.key,
        label: segment.category,
        value: segment.value,
        color: segment.color,
        hidden: segment.hidden,
      })),
    [decoratedSegments],
  );

  const printContext = usePrintContext();
  animated = printContext ? false : animated;

  const exportData = useExportChartData({
    type: "bar",
    data,
    categoryKey: categoryKey as string,
    dataKeys: [dataKey as string],
    colors,
    legend,
    extraOptions: {
      barDir: "bar",
      barGrouping: "stacked",
    },
  });

  // Handle legend item hover with tooltip positioning
  const handleLegendItemHover = useCallback(
    (hoverIndex: number | null) => {
      const segment = hoverIndex === null ? undefined : decoratedSegments[hoverIndex];
      // A hidden segment has no rendered element to point the tooltip at.
      if (hoverIndex === null || !segment || segment.hidden) {
        setActiveIndex(null);
        setHoveredLegendKey(null);
        setTooltipPosition(null);
        return;
      }

      setActiveIndex(hoverIndex);
      setHoveredLegendKey(segment.key);

      // Only the visible segments are in the DOM, so the legend index has to be
      // mapped onto the rendered position.
      const renderedIndex = visibleSegments.findIndex((item) => item.index === segment.index);
      const segmentEl = wrapperRef.current?.querySelectorAll(
        ".openui-single-stacked-bar-chart-segment",
      )?.[renderedIndex] as HTMLDivElement | undefined;
      if (segmentEl) {
        const rect = segmentEl.getBoundingClientRect();
        const containerRect = wrapperRef.current?.getBoundingClientRect();
        if (containerRect) {
          const relativeX = rect.left + rect.width / 2 - containerRect.left;
          const relativeY = rect.top - containerRect.top;
          setTooltipPosition({ x: relativeX, y: relativeY });
        } else {
          setTooltipPosition({ x: rect.left + rect.width / 2, y: rect.top });
        }
      }
    },
    [decoratedSegments, visibleSegments],
  );

  // Segmented progress bar
  return (
    <div
      ref={wrapperRef}
      className={clsx("openui-single-stacked-bar-chart-container", className, {
        "openui-single-stacked-bar-chart-container-gap": legend && legendVariant === "default",
      })}
      style={style}
      data-openui-chart={exportData}
    >
      <div className="openui-single-stacked-bar-chart">
        {visibleSegments.map((segment) => {
          const index = segment.index;
          const isActive = activeIndex === null || activeIndex === index;
          return (
            <div
              key={`segment-${index}`}
              className={clsx("openui-single-stacked-bar-chart-segment", {
                "openui-single-stacked-bar-chart-animated": animated,
              })}
              style={{
                width: `${segment.percentage}%`,
                backgroundColor: segment.color,
                opacity: isActive ? 1 : 0.5,
              }}
              onMouseEnter={(e) => {
                setActiveIndex(index);
                setHoveredLegendKey(segment.key);
                const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                const containerRect = wrapperRef.current?.getBoundingClientRect();
                if (containerRect) {
                  // Position relative to container so FloatingUIPortal aligns correctly
                  const relativeX = rect.left + rect.width / 2 - containerRect.left;
                  const relativeY = rect.top - containerRect.top;
                  setTooltipPosition({ x: relativeX, y: relativeY });
                } else {
                  setTooltipPosition({ x: rect.left + rect.width / 2, y: rect.top });
                }
              }}
              onMouseLeave={() => {
                setActiveIndex(null);
                setHoveredLegendKey(null);
              }}
            >
              <div className="openui-single-stacked-bar-chart-segment-line" />
            </div>
          );
        })}
      </div>
      {activeIndex !== null && tooltipPosition && (
        <FloatingUIPortal position={tooltipPosition} placement="top" offsetDistance={10}>
          <ToolTip
            label={legendItems[activeIndex]?.label ?? ""}
            color={stackedLegendItems[activeIndex]?.color ?? "#000000"}
            value={stackedLegendItems[activeIndex]?.value ?? 0}
            percentage={decoratedSegments[activeIndex]?.percentage ?? 0}
          />
        </FloatingUIPortal>
      )}

      {legend && legendVariant === "default" && <Separator />}

      {legend && legendVariant === "default" && (
        <DefaultLegend
          items={legendItems}
          isExpanded={isLegendExpanded}
          setIsExpanded={setIsLegendExpanded}
          containerWidth={containerWidth}
          style={{ paddingTop: 0 }}
          {...legendInteractionProps}
        />
      )}
      {legend && legendVariant === "stacked" && (
        <StackedLegend
          items={stackedLegendItems}
          containerWidth={containerWidth}
          onItemHover={setHoveredLegendKey}
          activeKey={hoveredLegendKey}
          onLegendItemHover={handleLegendItemHover}
          separator
          showTitle={false}
          layout="showMore"
          className="openui-single-stacked-bar-chart-stacked-legend"
          {...legendInteractionProps}
        />
      )}
    </div>
  );
};
