import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { createFakeDb } from "./testing/fakeDb.ts";
import {
  parseConversationStatus,
  whatsappAddNoteAdapter,
  whatsappSendTemplateAdapter,
  whatsappSendTextAdapter,
  whatsappSetStatusAdapter,
  // @ts-expect-error -- Node strip-types needs the extension.
} from "./whatsappAdapters.ts";

const RECENT = new Date(Date.now() - 60_000).toISOString();
const STALE = new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString();

const conversation = {
  id: "conv-1",
  phone_number: "+201001234567",
  contact_name: "Ali",
  status: "active",
  last_inbound_at: RECENT,
};

function ctx(db: unknown, sent: unknown[] = []) {
  return {
    db,
    actorId: "admin-1",
    async sendWhatsapp(input: unknown) {
      sent.push(input);
      return { id: "msg-1" };
    },
  };
}

const act = (kind: string, payload: Record<string, unknown>) => ({
  id: "a1",
  kind,
  label: kind,
  dependsOn: [],
  payload,
});

describe("whatsapp.send_text", () => {
  it("previews the recipient and body with no warnings inside the window", async () => {
    const db = createFakeDb({ tables: { whatsapp_conversations: [conversation] } });
    const out = await whatsappSendTextAdapter.preview(
      act("whatsapp.send_text", { conversationId: "conv-1", text: "See you at 4pm" }),
      ctx(db),
    );
    assert.equal(out.after.to, "+201001234567");
    assert.equal(out.after.text, "See you at 4pm");
    assert.deepEqual(out.warnings, []);
  });

  /**
   * Meta only permits free text within 24h of the patient's last message.
   * Surfacing it in preview means the doctor sees it before confirming rather
   * than getting a failure after.
   */
  it("warns when the 24h customer-care window has closed", async () => {
    const db = createFakeDb({
      tables: {
        whatsapp_conversations: [{ ...conversation, last_inbound_at: STALE }],
      },
    });
    const out = await whatsappSendTextAdapter.preview(
      act("whatsapp.send_text", { conversationId: "conv-1", text: "hi" }),
      ctx(db),
    );
    assert.ok(out.warnings?.some((w: string) => /24h/.test(w)));
    assert.ok(out.warnings?.some((w: string) => /template/i.test(w)));
  });

  it("warns when the patient has never messaged", async () => {
    const db = createFakeDb({
      tables: {
        whatsapp_conversations: [{ ...conversation, last_inbound_at: null }],
      },
    });
    const out = await whatsappSendTextAdapter.preview(
      act("whatsapp.send_text", { conversationId: "conv-1", text: "hi" }),
      ctx(db),
    );
    assert.ok(out.warnings?.some((w: string) => /24h/.test(w)));
  });

  it("rejects empty text before reaching the network", async () => {
    const db = createFakeDb({ tables: { whatsapp_conversations: [conversation] } });
    await assert.rejects(
      () =>
        whatsappSendTextAdapter.preview(
          act("whatsapp.send_text", { conversationId: "conv-1", text: "   " }),
          ctx(db),
        ),
      /text is required/i,
    );
  });

  it("sends with the confirming admin recorded as the sender", async () => {
    const sent: unknown[] = [];
    const db = createFakeDb({ tables: { whatsapp_conversations: [conversation] } });
    const out = await whatsappSendTextAdapter.execute(
      act("whatsapp.send_text", { conversationId: "conv-1", text: " hello " }),
      ctx(db, sent),
    );
    assert.equal(out.ok, true);
    assert.deepEqual(sent, [
      { conversationId: "conv-1", sentBy: "admin-1", text: "hello" },
    ]);
  });

  it("fails clearly when Kapso is not configured", async () => {
    const db = createFakeDb({ tables: { whatsapp_conversations: [conversation] } });
    await assert.rejects(
      () =>
        whatsappSendTextAdapter.execute(
          act("whatsapp.send_text", { conversationId: "conv-1", text: "hi" }),
          { db, actorId: "admin-1" },
        ),
      /not configured/i,
    );
  });
});

describe("whatsapp.send_template", () => {
  it("sends a named template with body parameters", async () => {
    const sent: Record<string, unknown>[] = [];
    const db = createFakeDb({ tables: { whatsapp_conversations: [conversation] } });
    await whatsappSendTemplateAdapter.execute(
      act("whatsapp.send_template", {
        conversationId: "conv-1",
        name: "appointment_reminder",
        language: "ar",
        body: ["Ali", "4pm"],
      }),
      ctx(db, sent),
    );
    const template = sent[0].template as Record<string, unknown>;
    assert.equal(template.name, "appointment_reminder");
    assert.equal(template.language, "ar");
    assert.deepEqual(template.body, [
      { type: "text", text: "Ali" },
      { type: "text", text: "4pm" },
    ]);
  });

  it("does not warn about the 24h window — templates are the way out of it", async () => {
    const db = createFakeDb({
      tables: {
        whatsapp_conversations: [{ ...conversation, last_inbound_at: STALE }],
      },
    });
    const out = await whatsappSendTemplateAdapter.preview(
      act("whatsapp.send_template", { conversationId: "conv-1", name: "reminder" }),
      ctx(db),
    );
    assert.ok(!out.warnings?.length);
  });

  it("requires a template name", async () => {
    const db = createFakeDb({ tables: { whatsapp_conversations: [conversation] } });
    await assert.rejects(
      () =>
        whatsappSendTemplateAdapter.preview(
          act("whatsapp.send_template", { conversationId: "conv-1", name: "" }),
          ctx(db),
        ),
      /name is required/i,
    );
  });
});

describe("whatsapp.set_status", () => {
  it("archives a conversation", async () => {
    const db = createFakeDb({ tables: { whatsapp_conversations: [conversation] } });
    const out = await whatsappSetStatusAdapter.execute(
      act("whatsapp.set_status", { conversationId: "conv-1", status: "archived" }),
      ctx(db),
    );
    assert.match(out.message ?? "", /archived/i);
    assert.equal(db.updatesTo("whatsapp_conversations")[0].values.status, "archived");
  });

  it("rejects a status outside active/archived", () => {
    assert.throws(() => parseConversationStatus("ended"), /Unknown conversation status/);
    assert.equal(parseConversationStatus("Active"), "active");
  });
});

describe("whatsapp.add_note", () => {
  it("inserts an internal note rather than messaging the patient", async () => {
    const sent: unknown[] = [];
    const db = createFakeDb({ tables: { whatsapp_conversations: [conversation] } });
    await whatsappAddNoteAdapter.execute(
      act("whatsapp.add_note", { conversationId: "conv-1", body: "Allergic to penicillin" }),
      ctx(db, sent),
    );
    assert.equal(sent.length, 0, "a note must never reach the patient");
    const [insert] = db.insertsTo("whatsapp_notes");
    assert.equal(insert.values.body, "Allergic to penicillin");
    assert.equal(insert.values.author, "Clinic Assist");
  });

  it("requires a note body", async () => {
    const db = createFakeDb({ tables: { whatsapp_conversations: [conversation] } });
    await assert.rejects(
      () =>
        whatsappAddNoteAdapter.preview(
          act("whatsapp.add_note", { conversationId: "conv-1", body: "  " }),
          ctx(db),
        ),
      /body is required/i,
    );
  });
});
