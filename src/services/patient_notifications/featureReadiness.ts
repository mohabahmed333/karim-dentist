/**
 * For every feature: what it does, and each condition it needs to actually work.
 *
 * This list is the single source of truth. The Settings screen renders it, and
 * the feature guide describes the same conditions — so a new prerequisite added
 * here shows up in both.
 */

import {
  assistantActs,
  assistantOn,
  databaseUpdated,
  FIX,
  sendPipeline,
  templateCondition,
  type Condition,
  type FeatureFacts,
} from "./featureConditions";

export type FeatureState = "working" | "blocked" | "check";

export type Feature = {
  key: string;
  title: string;
  summary: string;
  conditions: Condition[];
  state: FeatureState;
};

const manual = (key: string, label: string, why: string, fix: string): Condition => ({
  key,
  label,
  met: null,
  why,
  fix,
});

/** Any unmet condition blocks; anything unverifiable asks for a human check. */
export function stateOf(conditions: Condition[]): FeatureState {
  if (conditions.some((x) => x.met === false)) return "blocked";
  if (conditions.some((x) => x.met === null)) return "check";
  return "working";
}

export function evaluateFeatures(f: FeatureFacts): Feature[] {
  const pipeline = sendPipeline(f);
  const lead = f.notifications?.reminderLeadMinutes;

  const features: Omit<Feature, "state">[] = [
    {
      key: "confirmations",
      title: "Booking confirmations",
      summary: "The patient gets a WhatsApp message as soon as an appointment is booked, from any source.",
      conditions: [...pipeline, templateCondition("confirmation", f)],
    },
    {
      key: "reminders",
      title: "Day-before reminders",
      summary: "The patient is reminded the day before, in their own language.",
      conditions: [
        ...pipeline,
        templateCondition("reminder_24h", f),
        {
          key: "lead_1440",
          label: "Reminder sent 24 hours (1440 minutes) ahead",
          met: lead === undefined ? null : lead === 1440,
          why: "The approved text says “tomorrow”. With any other lead time reminders are skipped rather than sent with the wrong day.",
          fix: "Set Reminder lead to 1440 minutes in this tab, then Save.",
        },
      ],
    },
    {
      key: "cancellations",
      title: "Cancellation notices",
      summary: "The patient is told when staff cancel their appointment.",
      conditions: [...pipeline, templateCondition("cancellation", f)],
    },
    {
      key: "reschedules",
      title: "Reschedule notices",
      summary: "The patient is told when their appointment moves.",
      conditions: [...pipeline, templateCondition("reschedule", f)],
    },
    {
      key: "cancel_by_reply",
      title: "Cancel by replying to a reminder",
      summary: "A patient answers a reminder with “cancel” / “الغاء” and the slot is freed.",
      conditions: [templateCondition("reminder_24h", f), ...assistantActs(f)],
    },
    {
      key: "waitlist",
      title: "Waitlist offers",
      summary: "A cancelled slot is offered to the three longest-waiting patients; the first to accept books it.",
      conditions: [
        ...pipeline,
        templateCondition("waitlist_offer", f),
        ...assistantActs(f),
      ],
    },
    {
      key: "followups",
      title: "Post-visit follow-ups",
      summary: "The day after a visit, the patient is asked how they are feeling.",
      conditions: [
        ...pipeline,
        templateCondition("followup", f),
        manual("mark_completed", "Staff mark visits as completed",
          "Follow-ups are only sent for visits marked completed. A visit left as confirmed never gets one.",
          "Mark each visit as Completed in Reservations once the patient has been seen."),
      ],
    },
    {
      key: "recalls",
      title: "Six-month check-up recalls",
      summary: "A patient whose last visit was over six months ago, with nothing booked, is invited back.",
      conditions: [
        ...pipeline,
        templateCondition("recall_6m", f),
        {
          key: "recall_switch",
          label: "Recalls and review requests switched on",
          met: Boolean(f.notifications?.recallEnabled),
          why: "These are marketing messages with their own switch, off by default.",
          fix: "Turn on “Recalls and review requests” in this tab, then Save.",
        },
        manual("consent", "Patients have agreed to marketing messages",
          "Meta requires consent for marketing templates. This cannot be checked automatically.",
          "Collect each patient's agreement to marketing messages before switching recalls on."),
      ],
    },
    {
      key: "reviews",
      title: "Review requests",
      summary: "A patient who replies happily to their follow-up is asked for a review. Unhappy patients never are.",
      conditions: [
        ...pipeline,
        templateCondition("followup", f),
        templateCondition("review_request", f),
        {
          key: "recall_switch",
          label: "Recalls and review requests switched on",
          met: Boolean(f.notifications?.recallEnabled),
          why: "Review requests share the marketing switch.",
          fix: "Turn on “Recalls and review requests” in this tab, then Save.",
        },
        ...assistantOn(f),
        {
          key: "map_url",
          label: "Clinic map / review link set in site settings",
          met: f.clinicMapUrl,
          why: "The review request needs a link to send the patient to.",
          fix: "Add the clinic's Google Maps link in the contact settings.",
        },
      ],
    },
    {
      key: "voice_notes",
      title: "Voice notes answered",
      summary: "A patient's voice message is transcribed and answered like text.",
      conditions: [
        ...assistantOn(f),
        manual("transcription", "WhatsApp provider transcribes audio",
          "Kapso provides the transcript. A note whose transcript has not arrived, or is only music, is not answered.",
          "Nothing to build — Kapso transcribes automatically. Send a test voice note to confirm it is answered."),
      ],
    },
    {
      key: "knowledge",
      title: "Clinic knowledge answers",
      summary: "The assistant answers prices, policies and aftercare from facts staff have written.",
      conditions: [
        databaseUpdated(f, "The knowledge table does not exist yet, so there is nothing to search."),
        ...assistantOn(f),
        {
          key: "knowledge_entries",
          label: "At least one published knowledge entry",
          met: f.publishedKnowledge === null ? null : f.publishedKnowledge > 0,
          why: "With nothing published the assistant has nothing to quote and hands every such question to staff.",
          fix: "Add and publish at least one entry in Clinic knowledge.",
        },
      ],
    },
    {
      key: "review_queue",
      title: "Learning from staff corrections",
      summary: "Drafts staff rewrote before sending are collected for review.",
      conditions: [
        databaseUpdated(f, "Corrections are saved to a table that does not exist yet. Saving fails quietly so a send is never blocked — which means nothing is collected."),
        ...assistantOn(f),
      ],
    },
    {
      key: "stop",
      title: "STOP opt-outs",
      summary: "A patient who texts STOP or إيقاف receives no more clinic-initiated messages.",
      conditions: [
        {
          key: "migrations",
          label: "Database updated with the notification tables",
          met: f.notificationTablesPresent,
          why: "The opt-out has nowhere to be recorded.",
          fix: FIX.migrations,
        },
        {
          key: "webhook",
          label: "WhatsApp webhook secret set",
          met: f.env.kapsoWebhookSecret,
          why: "Incoming messages are rejected, so a STOP is never seen. This works even while the assistant is off.",
          fix: FIX.webhook,
        },
      ],
    },
  ];

  return features.map((feature) => ({ ...feature, state: stateOf(feature.conditions) }));
}
