type MinimalStorage = Pick<Storage, "getItem" | "setItem">;

export type LocalPreference = {
  subscribe: (onChange: () => void) => () => void;
  /** The stored string, or null when unset/unavailable. */
  get: () => string | null;
  set: (next: string | null) => void;
};

/**
 * A single `localStorage` key, shaped for `useSyncExternalStore`.
 *
 * `localStorage` does not exist while rendering on the server, so a preference
 * cannot be plain state seeded from it. This is the shape React provides for
 * exactly that: hydrate from the server snapshot, then re-render against the
 * real value — no setState in an effect, and no hydration mismatch. The value
 * is cached so `get` is stable between writes, which `useSyncExternalStore`
 * requires; it is called on every render.
 */
export function createLocalPreference(
  key: string,
  resolveStorage: () => MinimalStorage | null = () =>
    typeof window === "undefined" ? null : window.localStorage,
): LocalPreference {
  const listeners = new Set<() => void>();
  let cache: string | null | undefined;

  return {
    subscribe(onChange) {
      listeners.add(onChange);
      return () => {
        listeners.delete(onChange);
      };
    },
    get() {
      if (cache === undefined) {
        try {
          cache = resolveStorage()?.getItem(key) ?? null;
        } catch {
          // Private mode or blocked storage — unset is the safe default.
          cache = null;
        }
      }
      return cache;
    },
    set(next) {
      cache = next;
      try {
        // Removing would need a third storage method for one caller; an empty
        // string reads back as unset either way.
        resolveStorage()?.setItem(key, next ?? "");
      } catch {
        // Not worth surfacing; the preference still holds for this session.
      }
      for (const listener of listeners) listener();
    },
  };
}
