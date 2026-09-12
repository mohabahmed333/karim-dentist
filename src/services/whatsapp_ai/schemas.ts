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

/**
 * Treat "" as "not provided".
 *
 * Models fill in every key of a template they are shown, so a booking action
 * arrives carrying `"reservationId": ""`. Validated strictly, one empty string
 * fails the whole envelope — the reply, the action and all — and the patient
 * who just tapped "Confirm booking" gets nothing. Observed against the real
 * model on the real prompt.
 */
function omitEmpty<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    schema,
  );
}

export const botActionSchema = z.object({
  kind: botActionKindSchema,
  /** Must be one the server offered this turn; validated against state. */
  slotId: omitEmpty(z.string().uuid().optional()),
  reservationId: omitEmpty(z.string().uuid().optional()),
  patientName: omitEmpty(z.string().trim().min(1).max(120).optional()),
  serviceLabel: omitEmpty(z.string().trim().min(1).max(120).optional()),
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
  /**
   * Ids the model says it offered. Junk is dropped rather than failing the
   * envelope: these are cross-checked against the server's own list anyway, so
   * a bad entry can cost nothing, while a rejected envelope costs the reply.
   */
  offeredSlotIds: z
    .array(z.string())
    .max(20)
    .default([])
    .catch([])
    .transform((ids) =>
      ids.filter((id) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id),
      ),
    ),
  needs: z
    .array(z.enum(["patient_name", "service", "slot", "reservation_id"]))
    .max(4)
    .default([])
    .catch([]),
  /**
   * What the patient has told the assistant so far in this booking. The server
   * keeps it between turns, so a field reported once is never asked for again.
   * `.catch` so a malformed report degrades to "nothing new learned" rather
   * than failing the whole reply into a handoff.
   */
  collected: z
    .object({
      service: z.string().nullish(),
      patientName: z.string().nullish(),
      slotId: z.string().nullish(),
    })
    .default({})
    .catch({}),
});

export type AutoReplyEnvelope = z.infer<typeof autoReplyEnvelopeSchema>;
