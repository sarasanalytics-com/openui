import { useCallback, useMemo, useRef, useState } from "react";

export interface UseSeriesVisibilityResult {
  /** Keys of the series that are currently hidden. */
  hiddenKeys: Set<string>;
  /** Data keys that are still visible, in their original order. */
  visibleKeys: string[];
  /** Hide/show a single series. No-op when it would hide the last visible series. */
  toggle: (key: string) => void;
  /** Show only this series. Calling it again on the sole visible series restores all. */
  isolate: (key: string) => void;
  /** Restore every series. */
  showAll: () => void;
  /** Whether a series is currently hidden. */
  isHidden: (key: string) => boolean;
}

/**
 * Tracks which series of a chart are hidden, with a "keep at least one visible"
 * guard so a chart can never end up empty.
 *
 * Hidden state resets whenever the set of data keys changes (compared by content,
 * not by array identity, so ordinary re-renders keep the user's selection).
 *
 * All returned callbacks are stable across re-renders so memoized consumers such
 * as `DefaultLegend` do not re-render needlessly.
 */
export const useSeriesVisibility = (dataKeys: string[]): UseSeriesVisibilityResult => {
  const keysSignature = dataKeys.join("\u0000");

  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(() => new Set<string>());
  const [prevSignature, setPrevSignature] = useState(keysSignature);

  // Reset during render (instead of in an effect) so consumers never see a frame
  // with stale hidden keys after the series change.
  if (prevSignature !== keysSignature) {
    setPrevSignature(keysSignature);
    if (hiddenKeys.size > 0) {
      setHiddenKeys(new Set<string>());
    }
  }

  // Refs keep the callbacks stable while still reading the latest values.
  const dataKeysRef = useRef(dataKeys);
  dataKeysRef.current = dataKeys;
  const hiddenKeysRef = useRef(hiddenKeys);
  hiddenKeysRef.current = hiddenKeys;

  const toggle = useCallback((key: string) => {
    setHiddenKeys((prev) => {
      const keys = dataKeysRef.current;
      if (!keys.includes(key)) return prev;

      if (prev.has(key)) {
        const next = new Set(prev);
        next.delete(key);
        return next;
      }

      // Keep at least one series visible.
      const visibleCount = keys.filter((k) => !prev.has(k)).length;
      if (visibleCount <= 1) return prev;

      const next = new Set(prev);
      next.add(key);
      return next;
    });
  }, []);

  const isolate = useCallback((key: string) => {
    setHiddenKeys((prev) => {
      const keys = dataKeysRef.current;
      if (!keys.includes(key)) return prev;

      const visible = keys.filter((k) => !prev.has(k));
      // Already isolated -> restore everything.
      if (visible.length === 1 && visible[0] === key) {
        return prev.size === 0 ? prev : new Set<string>();
      }

      return new Set(keys.filter((k) => k !== key));
    });
  }, []);

  const showAll = useCallback(() => {
    setHiddenKeys((prev) => (prev.size === 0 ? prev : new Set<string>()));
  }, []);

  const isHidden = useCallback((key: string) => hiddenKeysRef.current.has(key), []);

  const visibleKeys = useMemo(
    () => dataKeys.filter((key) => !hiddenKeys.has(key)),
    [dataKeys, hiddenKeys],
  );

  return {
    hiddenKeys,
    visibleKeys,
    toggle,
    isolate,
    showAll,
    isHidden,
  };
};
