import type { ProviderError } from "./callProvider";
import type { ChainEntry } from "./modelChain";

/**
 * Which models we know are out of capacity, and until when.
 *
 * Process-local and deliberately so. The win is that a warm instance stops
 * paying a round-trip to a model it watched hit its daily cap a minute ago; a
 * cold instance re-learning that costs exactly one request. A table in the
 * database would buy consistency we have no use for, and put a write on the
 * path of every patient's message.
 */
const until = new Map<string, number>();

const MINUTE = 60_000;
/** A per-minute limit clears itself, so never sit one out for long. */
const RATE_LIMIT_CAP_MS = 5 * MINUTE;
/** A daily cap is the one that genuinely removes a model for a while. */
const DAILY_CAP_MS = 60 * MINUTE;
const BAD_KEY_MS = 30 * MINUTE;

const keyOf = (entry: ChainEntry) => `${entry.provider}:${entry.model}`;

/** Groq and friends name the window they enforced in the body of the 429. */
const isDailyLimit = (detail: string) => /per day|\bTPD\b|\bRPD\b/i.test(detail);

function cooldownMs(error: ProviderError): number {
  if (error.status === 401 || error.status === 403) return BAD_KEY_MS;
  if (error.status !== 429) return 0;

  const daily = isDailyLimit(error.detail);
  const cap = daily ? DAILY_CAP_MS : RATE_LIMIT_CAP_MS;
  if (error.retryAfterMs !== null) return Math.min(error.retryAfterMs, cap);
  return daily ? DAILY_CAP_MS : MINUTE;
}

/**
 * Record what a model's failure tells us about its availability.
 *
 * Only quota and credentials park a model. A 5xx, a timeout or a bad request
 * says nothing about capacity, and skipping the model on that basis would turn
 * one blip into an outage of our own making.
 */
export function noteFailure(
  entry: ChainEntry,
  error: ProviderError,
  now: number = Date.now(),
): void {
  const ms = cooldownMs(error);
  if (ms > 0) until.set(keyOf(entry), now + ms);
}

export function isCoolingDown(entry: ChainEntry, now: number = Date.now()): boolean {
  const expires = until.get(keyOf(entry));
  if (expires === undefined) return false;
  if (expires <= now) {
    until.delete(keyOf(entry));
    return false;
  }
  return true;
}

/** Tests only — the map is module state shared by everything in the process. */
export function resetCooldowns(): void {
  until.clear();
}
