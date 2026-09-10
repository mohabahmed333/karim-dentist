import { z } from "zod";

/**
 * The bot's entire action vocabulary — deliberately NOT admin_ai's
 * actionKindSchema.
 *
 * This narrowness is the real containment: the worst case of a fully
 * successful prompt injection is an appointment change for the phone number
 * that sent the message. It is structurally impossible for the bot to write a
 * prescription, edit the website, or touch a dental chart.
 */
export const botActionKindSchema = z.enum([
  "booking.book_slot",
  "booking.reschedule",
  "booking.cancel",
]);

export type BotActionKind = z.infer<typeof botActionKindSchema>;

export const botActionSchema = z.object({
  kind: botActionKindSchema,
  /** Must be one the server offered this turn; validated against state. */
  slotId: z.string().uuid().optional(),
  reservationId: z.string().uuid().optional(),
  patientName: z.string().trim().min(1).max(120).optional(),
  serviceLabel: z.string().trim().min(1).max(120).optional(),
});

export type BotAction = z.infer<typeof botActionSchema>;

export const autoReplyIntentSchema = z.enum([
  "greeting",
  "hours",
  "location",
  "directions",
  "pricing",
  "services",
  "booking_availability",
  "booking_request",
  "booking_reschedule",
  "booking_cancel",
  "booking_confirm",
  // A reply to the clinic's post-visit follow-up. Classified so that a review
  // request can be sent to a happy patient and never to an unhappy one.
  "feedback_positive",
  "feedback_negative",
  "clinical_question",
  "complaint",
  "emergency",
  "other",
]);

export type AutoReplyIntent = z.infer<typeof autoReplyIntentSchema>;

/**
 * What the model must return.
 *
 * Note it reports what it *thinks*; it never decides whether to send. That is
 * decideAutoReply's job, so a confident-sounding model cannot talk its way
 * past the autonomy rules.
 */
export const autoReplyEnvelopeSchema = z.object({
  language: z.enum(["ar", "en"]).default("en"),
  intent: autoReplyIntentSchema,
  confidence: z.number().min(0).max(1),
  /** Explicit escape hatch the model can pull at any time. */
  handoff: z.boolean().default(false),
  handoffReason: z.string().max(200).default(""),
  reply: z.string().trim().min(1).max(900),
  ack: z.string().max(160).default(""),
  actions: z.array(botActionSchema).max(2).default([]),
  offeredSlotIds: z.array(z.string().uuid()).max(5).default([]),
  needs: z
    .array(z.enum(["patient_name", "service", "slot", "reservation_id"]))
    .max(4)
    .default([]),
});

export type AutoReplyEnvelope = z.infer<typeof autoReplyEnvelopeSchema>;
