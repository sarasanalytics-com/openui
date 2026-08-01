import { useMemo } from "react";
import { useSeriesVisibility, type SeriesVisibilityChange } from "./useSeriesVisibility";

/** Shared, referentially stable "nothing is hidden" set. */
const EMPTY_HIDDEN_KEYS: ReadonlySet<string> = new Set<string>();

/** Shared, referentially stable "legend is not interactive" props. */
const STATIC_LEGEND_PROPS = {} as const;

export interface CategoryLegendInteractionProps {
  onItemClick?: (key: string) => void;
  onItemDoubleClick?: (key: string) => void;
}

export interface UseCategoryVisibilityArgs {
  /** Every category/slice/segment of the chart, in palette order. Never filtered. */
  keys: string[];
  /**
   * When false the legend stays static and every category stays visible. Any
   * hidden state is dropped, so switching interaction back on starts clean.
   */
  enabled?: boolean;
  /** Notified after a legend interaction changed which categories are visible. */
  onVisibilityChange?: (change: SeriesVisibilityChange) => void;
}

export interface UseCategoryVisibilityResult {
  /** Categories currently hidden. Always empty when interaction is off. */
  hiddenKeys: ReadonlySet<string>;
  /** Categories to actually render. Equals `keys` when interaction is off. */
  visibleKeys: string[];
  /** Spread onto `<StackedLegend>` / `<DefaultLegend>`. Empty (and stable) when off. */
  legendInteractionProps: CategoryLegendInteractionProps;
}

/**
 * Glue between {@link useSeriesVisibility} and the categorical charts (Pie,
 * Radial, SingleStackedBar), whose "series" are the slices of a single data key
 * rather than a set of data keys.
 *
 * Same two invariants as `useInteractiveLegend`:
 *
 * 1. `keys` is never shrunk. Palette colors are positional over the full,
 *    value-sorted category list, so charts must keep deriving colors from that
 *    list (a category -> color map) and use `hiddenKeys` only to decide what to
 *    render and what percentages/totals are re-based on.
 * 2. The returned handlers come straight from `useSeriesVisibility` and are
 *    stable across re-renders.
 *
 * Double click: the browser fires two `click`s before `dblclick`, so a double
 * click runs `toggle` twice (which always cancels out) and then `isolate`. The
 * net effect is the isolate, exactly as intended.
 */
export const useCategoryVisibility = ({
  keys,
  enabled = true,
  onVisibilityChange,
}: UseCategoryVisibilityArgs): UseCategoryVisibilityResult => {
  const { hiddenKeys, visibleKeys, toggle, isolate } = useSeriesVisibility(
    keys,
    onVisibilityChange,
    { enabled },
  );

  const legendInteractionProps: CategoryLegendInteractionProps = useMemo(() => {
    if (!enabled) {
      return STATIC_LEGEND_PROPS;
    }
    return { onItemClick: toggle, onItemDoubleClick: isolate };
  }, [enabled, toggle, isolate]);

  return {
    hiddenKeys: enabled ? hiddenKeys : EMPTY_HIDDEN_KEYS,
    visibleKeys: enabled ? visibleKeys : keys,
    legendInteractionProps,
  };
};
