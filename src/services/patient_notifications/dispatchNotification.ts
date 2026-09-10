/**
 * Send one queued notification.
 *
 * Dependencies are injected, following runAutoReply: the interesting behaviour
 * is the ordering of side effects, and that is only testable if the side
 * effects are substitutable.
 *
 * Never throws. Every path — including a provider outage — resolves to a
 * recorded status, because the caller runs on a cron where an exception is
 * invisible.
 */

import type { TemplateSendInput } from "@/services/whatsapp/sendKapso";
import { evaluateDispatchPolicy, type DispatchSettings } from "./dispatchPolicy";
import { pickPatientLanguage } from "./pickLanguage";
import type { DueNotification, FinishPatch } from "./store";
import { buildTemplateForKind } from "./templateParams";

export type DispatchOutcome = {
  status: "sent" | "skipped" | "deferred" | "failed";
  reason: string;
  messageId?: string | null;
};

export type DispatchDeps = {
  now: () => Date;
  settings: DispatchSettings;
  clinicName: string;
  hasTransport: boolean;
  isOptedOut: (phone: string) => Promise<boolean>;
  countSentLast24h: (phone: string) => Promise<number>;
  /** Newest inbound text from this patient, for choosing a language. */
  lastInboundBody: (phone: string) => Promise<string | null>;
  resolveConversation: (input: {
    phone: string;
    patientName: string;
  }) => Promise<string>;
  markSendStarted: (id: string) => Promise<void>;
  send: (input: {
    conversationId: string;
    template: TemplateSendInput;
  }) => Promise<{ id: string }>;
  finish: (id: string, patch: FinishPatch) => Promise<void>;
  /** Waitlist offers only: is the slot still free to claim? */
  isSlotOpen?: (slotId: string) => Promise<boolean>;
  /**
   * Waitlist offers only: register the slot as offered in this conversation,
   * so the assistant accepts "take it" for it instead of refusing it as
   * slot_not_offered.
   */
  rememberOfferedSlot?: (conversationId: string, slotId: string) => Promise<void>;
  /** Overridable so the send path can be tested before a template is approved. */
  buildTemplate?: typeof buildTemplateForKind;
};

export async function dispatchNotification(
  deps: DispatchDeps,
  row: DueNotification,
): Promise<DispatchOutcome> {
  const now = deps.now();

  try {
    const [optedOut, sentLast24h] = await Promise.all([
      deps.isOptedOut(row.phone),
      deps.countSentLast24h(row.phone),
    ]);

    const decision = evaluateDispatchPolicy({
      now,
      settings: deps.settings,
      row,
      optedOut,
      hasTransport: deps.hasTransport,
      sentLast24h,
    });

    if (decision.action === "defer") {
      // Back to pending at a later time. Not an attempt, not a failure.
      await deps.finish(row.id, {
        status: "pending",
        scheduledFor: decision.until.toISOString(),
        skipReason: decision.reason,
      });
      return { status: "deferred", reason: decision.reason };
    }

    // Everything except a dry run stops here. A dry run continues, so that what
    // it records is the message that would really have gone out.
    if (decision.action === "skip" && decision.reason !== "dry_run") {
      await deps.finish(row.id, { status: "skipped", skipReason: decision.reason });
      return { status: "skipped", reason: decision.reason };
    }

    // Offering a slot someone already took would invite a patient to claim
    // something that no longer exists. Checked here, at send time, because a
    // deferral can hold an offer back for hours.
    if (row.kind === "waitlist_offer") {
      const open =
        row.slot_id && deps.isSlotOpen ? await deps.isSlotOpen(row.slot_id) : false;
      if (!open) {
        await deps.finish(row.id, { status: "skipped", skipReason: "slot_taken" });
        return { status: "skipped", reason: "slot_taken" };
      }
    }

    const language = pickPatientLanguage({
      lastInboundBody: await deps.lastInboundBody(row.phone),
      patientName: row.patient_name,
    });
    const template = (deps.buildTemplate ?? buildTemplateForKind)(row.kind, {
      patientName: row.patient_name,
      clinicName: deps.clinicName,
      startsAt: row.starts_at ?? now.toISOString(),
      serviceLabel: row.service_label,
      language,
    });

    if (!template) {
      await deps.finish(row.id, {
        status: "skipped",
        skipReason: "no_approved_template",
        language,
      });
      return { status: "skipped", reason: "no_approved_template" };
    }

    const resolved = {
      language,
      templateName: template.name,
      payload: { body: (template.body ?? []).map((p) => p.text) },
    };

    if (decision.action === "skip") {
      // dry_run: record exactly what would have been sent, send nothing, and
      // never create a conversation for a patient we are not messaging.
      await deps.finish(row.id, {
        status: "skipped",
        skipReason: "dry_run",
        ...resolved,
      });
      return { status: "skipped", reason: "dry_run" };
    }

    const conversationId =
      row.conversation_id ??
      (await deps.resolveConversation({
        phone: row.phone,
        patientName: row.patient_name,
      }));

    // Past this point a retry could duplicate a message the patient already
    // has, so the row is marked before the provider is called and the sweeper
    // abandons anything that dies here.
    await deps.markSendStarted(row.id);

    const message = await deps.send({ conversationId, template });

    if (row.kind === "waitlist_offer" && row.slot_id && deps.rememberOfferedSlot) {
      // After the send, never before: registering an offer the patient never
      // received would let a stale "yes" from earlier claim it. A failure here
      // must not turn a delivered message into a recorded failure.
      await deps.rememberOfferedSlot(conversationId, row.slot_id).catch(() => undefined);
    }
    await deps.finish(row.id, {
      status: "sent",
      ...resolved,
      conversationId,
      outboundMessageId: message.id,
      sentAt: new Date().toISOString(),
      skipReason: null,
    });
    return { status: "sent", reason: "ok", messageId: message.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Dispatch failed";
    await deps
      .finish(row.id, { status: "failed", lastError: message })
      .catch(() => undefined);
    return { status: "failed", reason: message };
  }
}
