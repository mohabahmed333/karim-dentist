import { timeWindowsIssue } from "@/services/clinic_schedule/schemas";
import { regenerateOpenSlotsWithClient } from "@/services/clinic_schedule/regenerate";
import { expandClinicSlots } from "@/services/clinic_schedule/expandSlots";
import type { ClinicHours } from "@/services/clinic_schedule/types";
import type { ActionAdapter, ActionContext } from "./adapterTypes";

const SLOT_MINUTES = [15, 30, 45, 60, 90, 120];

async function loadHours(ctx: ActionContext): Promise<ClinicHours> {
  const { data, error } = await ctx.db
    .from("clinic_hours")
    .select("*")
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message || "Could not load clinic hours");
  if (!data) throw new Error("Clinic hours are not configured");
  return data as ClinicHours;
}

/**
 * Validate an hours patch the way the admin form does.
 *
 * The DB CHECK constraints catch slot_minutes and horizon_days, but overlapping
 * or malformed time windows are only caught in application code — and an
 * overlap silently collapses slots at the same start time, so it has to fail
 * loudly here rather than produce a quietly wrong schedule.
 */
export function mergeClinicHours(
  current: ClinicHours,
  payload: Record<string, unknown>,
): ClinicHours {
  const next: ClinicHours = {
    ...current,
    ...(Array.isArray(payload.open_weekdays)
      ? { open_weekdays: (payload.open_weekdays as unknown[]).map(Number) }
      : {}),
    ...(Array.isArray(payload.time_windows)
      ? { time_windows: (payload.time_windows as unknown[]).map(String) }
      : {}),
    ...(payload.slot_minutes !== undefined
      ? { slot_minutes: Number(payload.slot_minutes) }
      : {}),
    ...(payload.horizon_days !== undefined
      ? { horizon_days: Number(payload.horizon_days) }
      : {}),
    ...(payload.timezone !== undefined
      ? { timezone: String(payload.timezone) }
      : {}),
  };

  if (!next.open_weekdays.length) {
    throw new Error("At least one open weekday is required");
  }
  for (const day of next.open_weekdays) {
    if (!Number.isInteger(day) || day < 0 || day > 6) {
      throw new Error(`Invalid weekday: ${day} (expected 0–6, Sunday first)`);
    }
  }
  if (!SLOT_MINUTES.includes(next.slot_minutes)) {
    throw new Error(`slot_minutes must be one of ${SLOT_MINUTES.join(", ")}`);
  }
  if (next.horizon_days < 7 || next.horizon_days > 60) {
    throw new Error("horizon_days must be between 7 and 60");
  }
  const issue = timeWindowsIssue(next.time_windows);
  if (issue) throw new Error(issue);
  return next;
}

/** Change opening days, hours, slot length or booking horizon. */
export const scheduleSetHoursAdapter: ActionAdapter = {
  kind: "schedule.set_hours",
  write: true,
  async preview(action, ctx) {
    const current = await loadHours(ctx);
    const next = mergeClinicHours(current, action.payload);
    const slots = expandClinicSlots({
      openWeekdays: next.open_weekdays,
      timeWindows: next.time_windows,
      slotMinutes: next.slot_minutes,
      horizonDays: next.horizon_days,
    });
    return {
      target: "clinic_hours",
      before: {
        open_weekdays: current.open_weekdays,
        time_windows: current.time_windows,
        slot_minutes: current.slot_minutes,
        horizon_days: current.horizon_days,
      },
      after: {
        open_weekdays: next.open_weekdays,
        time_windows: next.time_windows,
        slot_minutes: next.slot_minutes,
        horizon_days: next.horizon_days,
      },
      snapshot: { clinic_hours: current },
      // Changing hours rebuilds the open slots, so say so before Confirm.
      warnings: [
        `Regenerates the schedule — about ${slots.length} open slots over ${next.horizon_days} days`,
      ],
    };
  },
  async execute(action, ctx) {
    const current = await loadHours(ctx);
    const next = mergeClinicHours(current, action.payload);
    const { error } = await ctx.db
      .from("clinic_hours")
      .update({
        open_weekdays: next.open_weekdays,
        time_windows: next.time_windows,
        slot_minutes: next.slot_minutes,
        horizon_days: next.horizon_days,
        timezone: next.timezone,
        updated_at: new Date().toISOString(),
      })
      .eq("id", current.id);
    if (error) throw new Error(error.message || "Could not save clinic hours");

    const created = await regenerateOpenSlotsWithClient(ctx.db, next);
    return {
      actionId: action.id,
      kind: action.kind,
      ok: true,
      message: `Hours saved — ${created} open slots`,
      result: { slots: created },
    };
  },
};

/** Rebuild upcoming open slots from the current hours. Booked slots survive. */
export const scheduleRegenerateSlotsAdapter: ActionAdapter = {
  kind: "schedule.regenerate_slots",
  write: true,
  async preview(action, ctx) {
    const hours = await loadHours(ctx);
    const slots = expandClinicSlots({
      openWeekdays: hours.open_weekdays,
      timeWindows: hours.time_windows,
      slotMinutes: hours.slot_minutes,
      horizonDays: hours.horizon_days,
    });
    const { data: booked } = await ctx.db
      .from("appointment_slots")
      .select("id")
      .eq("status", "booked")
      .gte("starts_at", new Date().toISOString());
    return {
      target: "appointment_slots",
      before: {},
      after: { open_slots: slots.length, horizon_days: hours.horizon_days },
      snapshot: { clinic_hours: hours },
      warnings: [
        `Rebuilds open slots for the next ${hours.horizon_days} days. ${
          (booked as unknown[] | null)?.length ?? 0
        } booked appointments are kept.`,
      ],
    };
  },
  async execute(action, ctx) {
    const hours = await loadHours(ctx);
    const created = await regenerateOpenSlotsWithClient(ctx.db, hours);
    return {
      actionId: action.id,
      kind: action.kind,
      ok: true,
      message: `Regenerated ${created} open slots`,
      result: { slots: created },
    };
  },
};

export const scheduleAdapters: ActionAdapter[] = [
  scheduleSetHoursAdapter,
  scheduleRegenerateSlotsAdapter,
];
