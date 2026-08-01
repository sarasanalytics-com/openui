import { useCallback, useMemo, useRef, useState } from "react";

/**
 * A single legend interaction that actually changed which series are visible.
 *
 * Guarded no-ops never produce one: a blocked hide of the last visible series,
 * a key that is not part of the chart, or a `showAll` while nothing is hidden
 * stay silent.
 *
 * A browser double click fires `click`, `click`, `dblclick`, so isolating a
 * series legitimately emits `hide`, `show`, `isolate` in that order. Consumers
 * that only care about the end state (analytics, for instance) should debounce.
 */
export type SeriesVisibilityChange = {
  /** Key the user acted on. Empty for `showAll`, which targets no single key. */
  key: string;
  /** What the interaction did, after guards. */
  action: "hide" | "show" | "isolate" | "restore";
  /** Keys visible AFTER the change, in original order. */
  visibleKeys: string[];
};

export interface UseSeriesVisibilityOptions {
  /**
   * When false the hidden state is cleared. Flipping it back on therefore starts
   * from "everything visible" instead of resurrecting a stale selection.
   */
  enabled?: boolean;
}

export interface UseSeriesVisibilityResult {
  /** Keys of the series that are currently hidden. */
  hiddenKeys: ReadonlySet<string>;
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
 * not by array identity, so ordinary re-renders keep the user's selection), and
 * whenever `enabled` flips.
 *
 * IMPORTANT — resets are silent. They clear the hidden keys during render and do
 * NOT fire `onChange` (a listener must never be called from render). Consumers
 * that mirror visibility elsewhere (analytics, a controlled prop, a stored
 * selection) have to re-derive it themselves when the data changes, rather than
 * assume `onChange` reports every transition. The key signature is also
 * order-sensitive: re-ordering the same series resets the selection too.
 *
 * All returned callbacks are stable across re-renders so memoized consumers such
 * as `DefaultLegend` do not re-render needlessly. `onChange` is read through a
 * ref, so passing a fresh arrow function on every render costs nothing.
 *
 * @param dataKeys Every series of the chart, in its original order.
 * @param onChange Notified after a change is applied. See
 *   {@link SeriesVisibilityChange} for what is and is not reported.
 * @param options See {@link UseSeriesVisibilityOptions}.
 */
export const useSeriesVisibility = (
  dataKeys: string[],
  onChange?: (change: SeriesVisibilityChange) => void,
  { enabled = true }: UseSeriesVisibilityOptions = {},
): UseSeriesVisibilityResult => {
  const keysSignature = dataKeys.join("\u0000");

  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(() => new Set<string>());
  const [prevSignature, setPrevSignature] = useState(keysSignature);
  const [prevEnabled, setPrevEnabled] = useState(enabled);

  // Reset during render (instead of in an effect) so consumers never see a frame
  // with stale hidden keys after the series change.
  if (prevSignature !== keysSignature) {
    setPrevSignature(keysSignature);
    if (hiddenKeys.size > 0) {
      setHiddenKeys(new Set<string>());
    }
  }

  // Turning interaction off must actually drop the selection: masking it would
  // resurrect series the user hid when interaction is switched back on.
  if (prevEnabled !== enabled) {
    setPrevEnabled(enabled);
    if (hiddenKeys.size > 0) {
      setHiddenKeys(new Set<string>());
    }
  }

  // Refs keep the callbacks stable while still reading the latest values.
  const dataKeysRef = useRef(dataKeys);
  dataKeysRef.current = dataKeys;
  const hiddenKeysRef = useRef(hiddenKeys);
  hiddenKeysRef.current = hiddenKeys;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  /**
   * Commits a new hidden set and reports it.
   *
   * The ref is updated up front so several interactions inside one tick still
   * read the latest state, and so the notification can be fired here — outside
   * the state updater, which must stay pure.
   */
  const applyChange = useCallback(
    (key: string, action: SeriesVisibilityChange["action"], next: Set<string>) => {
      hiddenKeysRef.current = next;
      setHiddenKeys(next);

      const listener = onChangeRef.current;
      if (!listener) return;
      listener({
        key,
        action,
        visibleKeys: dataKeysRef.current.filter((k) => !next.has(k)),
      });
    },
    [],
  );

  const toggle = useCallback(
    (key: string) => {
      const keys = dataKeysRef.current;
      if (!keys.includes(key)) return;

      const prev = hiddenKeysRef.current;

      if (prev.has(key)) {
        const next = new Set(prev);
        next.delete(key);
        applyChange(key, "show", next);
        return;
      }

      // Keep at least one series visible.
      const visibleCount = keys.filter((k) => !prev.has(k)).length;
      if (visibleCount <= 1) return;

      const next = new Set(prev);
      next.add(key);
      applyChange(key, "hide", next);
    },
    [applyChange],
  );

  const isolate = useCallback(
    (key: string) => {
      const keys = dataKeysRef.current;
      if (!keys.includes(key)) return;

      const prev = hiddenKeysRef.current;
      const visible = keys.filter((k) => !prev.has(k));

      // Already isolated -> restore everything.
      if (visible.length === 1 && visible[0] === key) {
        if (prev.size === 0) return;
        applyChange(key, "restore", new Set<string>());
        return;
      }

      applyChange(key, "isolate", new Set(keys.filter((k) => k !== key)));
    },
    [applyChange],
  );

  const showAll = useCallback(() => {
    if (hiddenKeysRef.current.size === 0) return;
    // Not scoped to a single series, hence the empty key.
    applyChange("", "restore", new Set<string>());
  }, [applyChange]);

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
