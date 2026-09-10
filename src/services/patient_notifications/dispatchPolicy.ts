/**
 * Whether one queued notification may go out right now.
 *
 * Pure, and the analogue of evaluateAutoReplyPolicy: first match wins, cheapest
 * and most absolute checks first, and every outcome carries a reason that lands
 * in the row so "why did this patient not get their reminder" is answerable
 * from SQL alone.
 *
 * The distinction that matters is skip versus defer. Skipping is final and is
 * for things that will never become true. Deferring is for things that are
 * merely not true yet — quiet hours, a rate cap — where dropping the message
 * would lose real information the patient wants.
 */

import { isTomorrowIn } from "./formatWhen";
import { nextSendableAt } from "./quietHours";

export type DispatchDecision =
  | { action: "send"; reason: "ok" }
  | { action: "skip"; reason: string }
  | { action: "defer"; until: Date; reason: string };

export type DispatchSettings = {
  mode: string;
  timezone: string;
  quiet_hours_start: number;
  quiet_hours_end: number;
  max_per_patient_per_day: number;
};

export type DispatchRow = {
  kind: string;
  source: string;
  starts_at: string | null;
  scheduled_for: string;
};

export type DispatchPolicyInput = {
  now: Date;
  settings: DispatchSettings;
  row: DispatchRow;
  optedOut: boolean;
  hasTransport: boolean;
  /** How many notifications this patient has already received in 24h. */
  sentLast24h: number;
};

/** A queue that has not drained in this long has been broken, not busy. */
const STALE_AFTER_MS = 6 * 60 * 60 * 1000;
const NO_TRANSPORT_RETRY_MS = 15 * 60 * 1000;
const RATE_LIMIT_RETRY_MS = 60 * 60 * 1000;

export function evaluateDispatchPolicy(
  input: DispatchPolicyInput,
): DispatchDecision {
  const { now, settings, row } = input;

  // Kill switch. Skipped rather than left pending, so that turning the system
  // on later does not fire a backlog of stale messages at every patient at once.
  if (settings.mode === "off") return { action: "skip", reason: "mode_off" };

  // Missing credentials are an operator problem that is usually fixed within
  // minutes, so hold rather than discard.
  if (!input.hasTransport) {
    return {
      action: "defer",
      until: new Date(now.getTime() + NO_TRANSPORT_RETRY_MS),
      reason: "no_transport",
    };
  }

  // Applied to every kind, not just marketing. A patient who said stop meant
  // stop; the clinic can still phone them.
  if (input.optedOut) return { action: "skip", reason: "opted_out" };

  // The bot has already said this in its own words, in the patient's own
  // thread. A template repeating it reads as a system glitch.
  if (row.kind === "cancellation" && row.source === "whatsapp_bot") {
    return { action: "skip", reason: "bot_already_told_patient" };
  }

  // Nothing here is worth saying about an appointment that has already passed.
  if (row.starts_at && Date.parse(row.starts_at) <= now.getTime()) {
    return { action: "skip", reason: "appointment_passed" };
  }

  // Measured from when it was due, not when it was created: a reminder is
  // enqueued days ahead by design, so created_at says nothing about staleness.
  if (now.getTime() - Date.parse(row.scheduled_for) > STALE_AFTER_MS) {
    return { action: "skip", reason: "stale" };
  }

  // The approved reminder template hardcodes the word "tomorrow". If the send
  // has slipped — deferred past midnight, or a lead time that no longer lines
  // up — the message would state the wrong day with complete confidence.
  // Saying nothing is better than that.
  if (
    row.kind === "reminder_24h" &&
    row.starts_at &&
    !isTomorrowIn(row.starts_at, now, settings.timezone)
  ) {
    return { action: "skip", reason: "no_longer_tomorrow" };
  }

  const sendable = nextSendableAt(now, {
    start: settings.quiet_hours_start,
    end: settings.quiet_hours_end,
    timeZone: settings.timezone,
  });
  if (sendable.getTime() > now.getTime()) {
    return { action: "defer", until: sendable, reason: "quiet_hours" };
  }

  // Deferred rather than skipped: the cap exists to stop a burst reading as
  // spam, not to decide that the third thing we had to say did not matter.
  if (input.sentLast24h >= settings.max_per_patient_per_day) {
    return {
      action: "defer",
      until: new Date(now.getTime() + RATE_LIMIT_RETRY_MS),
      reason: "daily_cap",
    };
  }

  // Last, so a dry run records the decision a real send would have reached —
  // including the template and parameters, which the caller resolves before
  // reaching this point.
  if (settings.mode === "dry_run") return { action: "skip", reason: "dry_run" };

  return { action: "send", reason: "ok" };
}
