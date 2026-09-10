import type { ActionAdapter, ActionContext } from "./adapterTypes";

function str(value: unknown, fallback = ""): string {
  return value == null ? fallback : String(value);
}

function requireSender(ctx: ActionContext) {
  if (!ctx.sendWhatsapp) {
    throw new Error("WhatsApp sending is not configured on this server");
  }
  return ctx.sendWhatsapp;
}

async function loadConversation(ctx: ActionContext, id: string) {
  const { data, error } = await ctx.db
    .from("whatsapp_conversations")
    .select("id,phone_number,contact_name,status,last_inbound_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message || "Could not load conversation");
  if (!data) throw new Error("Conversation not found");
  return data as {
    id: string;
    phone_number: string;
    contact_name: string | null;
    status: string;
    last_inbound_at: string | null;
  };
}

const SESSION_MS = 24 * 60 * 60 * 1000;

function sessionOpen(lastInboundAt: string | null): boolean {
  if (!lastInboundAt) return false;
  const at = Date.parse(lastInboundAt);
  return Number.isFinite(at) && Date.now() - at < SESSION_MS;
}

/** Send a free-text WhatsApp reply into an existing conversation. */
export const whatsappSendTextAdapter: ActionAdapter = {
  kind: "whatsapp.send_text",
  write: true,
  async preview(action, ctx) {
    const conversationId = str(action.payload.conversationId);
    const text = str(action.payload.text).trim();
    if (!text) throw new Error("Message text is required");

    const conversation = await loadConversation(ctx, conversationId);
    const warnings: string[] = [];
    // Meta only allows free text within 24h of the patient's last message.
    // Surfacing it here means the doctor sees it before confirming, not after.
    if (!sessionOpen(conversation.last_inbound_at)) {
      warnings.push(
        "24h customer-care window is closed — send an approved template instead",
      );
    }
    if (conversation.status === "ended") warnings.push("Conversation has ended");

    return {
      target: `conversation:${conversationId}`,
      before: {},
      after: { to: conversation.phone_number, text },
      snapshot: {
        [`conversation:${conversationId}`]: {
          last_inbound_at: conversation.last_inbound_at,
        },
      },
      warnings,
    };
  },
  async execute(action, ctx) {
    const send = requireSender(ctx);
    const message = await send({
      conversationId: str(action.payload.conversationId),
      sentBy: ctx.actorId,
      text: str(action.payload.text).trim(),
    });
    return {
      actionId: action.id,
      kind: action.kind,
      ok: true,
      message: "Message sent",
      result: { messageId: message.id },
    };
  },
};

/** Send a pre-approved Meta template — the only thing allowed outside 24h. */
export const whatsappSendTemplateAdapter: ActionAdapter = {
  kind: "whatsapp.send_template",
  write: true,
  async preview(action, ctx) {
    const conversationId = str(action.payload.conversationId);
    const name = str(action.payload.name).trim();
    if (!name) throw new Error("Template name is required");
    const conversation = await loadConversation(ctx, conversationId);
    return {
      target: `conversation:${conversationId}`,
      before: {},
      after: {
        to: conversation.phone_number,
        template: name,
        language: str(action.payload.language, "en"),
      },
      snapshot: { [`conversation:${conversationId}`]: { status: conversation.status } },
    };
  },
  async execute(action, ctx) {
    const send = requireSender(ctx);
    const params = Array.isArray(action.payload.body)
      ? (action.payload.body as unknown[]).map((v) => ({
          type: "text" as const,
          text: str(v),
        }))
      : undefined;
    const message = await send({
      conversationId: str(action.payload.conversationId),
      sentBy: ctx.actorId,
      template: {
        name: str(action.payload.name).trim(),
        language: str(action.payload.language, "en"),
        body: params,
      },
    });
    return {
      actionId: action.id,
      kind: action.kind,
      ok: true,
      message: "Template sent",
      result: { messageId: message.id },
    };
  },
};

const CONVERSATION_STATUSES = ["active", "archived"] as const;

export function parseConversationStatus(value: unknown): "active" | "archived" {
  const status = str(value).trim().toLowerCase();
  if (!(CONVERSATION_STATUSES as readonly string[]).includes(status)) {
    throw new Error(`Unknown conversation status: ${str(value)}`);
  }
  return status as "active" | "archived";
}

/** Archive or unarchive a conversation. */
export const whatsappSetStatusAdapter: ActionAdapter = {
  kind: "whatsapp.set_status",
  write: true,
  async preview(action, ctx) {
    const conversationId = str(action.payload.conversationId);
    const status = parseConversationStatus(action.payload.status);
    const conversation = await loadConversation(ctx, conversationId);
    return {
      target: `conversation:${conversationId}`,
      before: { status: conversation.status },
      after: { status },
      snapshot: {
        [`conversation:${conversationId}`]: { status: conversation.status },
      },
    };
  },
  async execute(action, ctx) {
    const conversationId = str(action.payload.conversationId);
    const status = parseConversationStatus(action.payload.status);
    const { error } = await ctx.db
      .from("whatsapp_conversations")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", conversationId);
    if (error) throw new Error(error.message || "Status update failed");
    return {
      actionId: action.id,
      kind: action.kind,
      ok: true,
      message: status === "archived" ? "Conversation archived" : "Conversation reopened",
      result: { conversationId, status },
    };
  },
};

/** Add an internal note to a conversation. Never sent to the patient. */
export const whatsappAddNoteAdapter: ActionAdapter = {
  kind: "whatsapp.add_note",
  write: true,
  async preview(action, ctx) {
    const conversationId = str(action.payload.conversationId);
    const body = str(action.payload.body).trim();
    if (!body) throw new Error("Note body is required");
    await loadConversation(ctx, conversationId);
    return {
      target: `conversation:${conversationId}`,
      before: {},
      after: { note: body, pinned: Boolean(action.payload.pinned) },
      snapshot: { [`note:${conversationId}`]: null },
    };
  },
  async execute(action, ctx) {
    const { error } = await ctx.db.from("whatsapp_notes").insert({
      conversation_id: str(action.payload.conversationId),
      body: str(action.payload.body).trim(),
      pinned: Boolean(action.payload.pinned),
      author: str(action.payload.author, "Clinic Assist"),
    });
    if (error) throw new Error(error.message || "Could not add note");
    return {
      actionId: action.id,
      kind: action.kind,
      ok: true,
      message: "Note added",
      result: { conversationId: str(action.payload.conversationId) },
    };
  },
};

export const whatsappAdapters: ActionAdapter[] = [
  whatsappSendTextAdapter,
  whatsappSendTemplateAdapter,
  whatsappSetStatusAdapter,
  whatsappAddNoteAdapter,
];
