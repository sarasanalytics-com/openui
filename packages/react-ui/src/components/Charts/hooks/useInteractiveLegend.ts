import { useMemo } from "react";
import { type LegendItem } from "../types";
import { getLegendItems } from "../utils/dataUtils";
import { useSeriesVisibility } from "./useSeriesVisibility";

/** Shared, referentially stable "nothing is hidden" set. */
const EMPTY_HIDDEN_KEYS: ReadonlySet<string> = new Set<string>();

/** Shared, referentially stable "legend is not interactive" props. */
const STATIC_LEGEND_PROPS = {} as const;

export interface LegendInteractionProps {
  onItemClick?: (key: string) => void;
  onItemDoubleClick?: (key: string) => void;
}

export interface UseInteractiveLegendArgs {
  /** Every series of the chart, in palette order. Never filtered. */
  dataKeys: string[];
  /** Palette colors, positionally aligned with `dataKeys`. */
  colors: string[];
  /** Optional per-series legend icons. */
  icons?: Partial<Record<string, React.ComponentType>>;
  /** When false the legend stays static and every series stays visible. */
  enabled?: boolean;
}

export interface UseInteractiveLegendResult {
  /** Series to actually render. Equals `dataKeys` when interaction is off. */
  visibleKeys: string[];
  /** Series currently hidden. Always empty when interaction is off. */
  hiddenKeys: ReadonlySet<string>;
  /** Legend items over ALL `dataKeys`, with `hidden` flagged on the hidden ones. */
  legendItems: LegendItem[];
  /** Spread onto `<DefaultLegend>`. Empty (and stable) when interaction is off. */
  legendInteractionProps: LegendInteractionProps;
}

/**
 * Glue between {@link useSeriesVisibility} and `DefaultLegend` for the cartesian
 * charts.
 *
 * Two invariants matter to every caller:
 *
 * 1. `dataKeys` is never shrunk. Palette colors are positional (middle-out over
 *    the full key list), so filtering the key list would recolor the surviving
 *    series. Charts must keep using `dataKeys` for the palette, the chart config
 *    and the transformed-key map, and use `visibleKeys` only to decide what to
 *    render and what the axis domains are derived from.
 * 2. The returned handlers come straight from `useSeriesVisibility` and are
 *    stable, so the memoized `DefaultLegend` is not re-rendered by them.
 *
 * Double click: the browser fires two `click`s before `dblclick`, so a double
 * click runs `toggle` twice (which always cancels out — an unhide has no guard,
 * and a blocked hide leaves state untouched for both clicks) and then `isolate`.
 * The net effect is the isolate, exactly as intended.
 */
export const useInteractiveLegend = ({
  dataKeys,
  colors,
  icons,
  enabled = true,
}: UseInteractiveLegendArgs): UseInteractiveLegendResult => {
  const { hiddenKeys, visibleKeys, toggle, isolate } = useSeriesVisibility(dataKeys);

  const effectiveHiddenKeys = enabled ? hiddenKeys : EMPTY_HIDDEN_KEYS;
  const effectiveVisibleKeys = enabled ? visibleKeys : dataKeys;

  const legendItems: LegendItem[] = useMemo(() => {
    const items = getLegendItems(dataKeys, colors, icons);
    if (effectiveHiddenKeys.size === 0) {
      return items;
    }
    return items.map((item) =>
      effectiveHiddenKeys.has(item.key) ? { ...item, hidden: true } : item,
    );
  }, [dataKeys, colors, icons, effectiveHiddenKeys]);

  const legendInteractionProps: LegendInteractionProps = useMemo(() => {
    if (!enabled) {
      return STATIC_LEGEND_PROPS;
    }
    return { onItemClick: toggle, onItemDoubleClick: isolate };
  }, [enabled, toggle, isolate]);

  return {
    visibleKeys: effectiveVisibleKeys,
    hiddenKeys: effectiveHiddenKeys,
    legendItems,
    legendInteractionProps,
  };
};
