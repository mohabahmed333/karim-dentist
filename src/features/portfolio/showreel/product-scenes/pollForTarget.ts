export type PollOptions = {
  timeoutMs?: number;
  intervalMs?: number;
  now?: () => number;
  schedule?: (fn: () => void, ms: number) => unknown;
  cancel?: (handle: unknown) => void;
};

const DEFAULT_TIMEOUT_MS = 1200;
const DEFAULT_INTERVAL_MS = 60;

/**
 * Retry `resolve` until it yields a value or the budget expires.
 * Showreel steps fire on a fixed timeline, but drawers and panels mount
 * late — a single probe silently drops the step and desyncs the demo.
 */
export function pollForTarget<T>(
  resolve: () => T | null | undefined,
  onSettled: (value: T | null) => void,
  options: PollOptions = {},
): () => void {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    intervalMs = DEFAULT_INTERVAL_MS,
    now = () => Date.now(),
    schedule = (fn, ms) => setTimeout(fn, ms),
    cancel = (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
  } = options;

  const started = now();
  let handle: unknown = null;
  let settled = false;

  const attempt = () => {
    if (settled) return;
    handle = null;

    const value = resolve();
    if (value !== null && value !== undefined) {
      settled = true;
      onSettled(value);
      return;
    }

    if (now() - started >= timeoutMs) {
      settled = true;
      onSettled(null);
      return;
    }

    handle = schedule(attempt, intervalMs);
  };

  attempt();

  return () => {
    if (settled) return;
    settled = true;
    if (handle !== null) cancel(handle);
  };
}
