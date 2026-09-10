import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import {
  mergeSupportMessages,
  patchConversationsFromMessage,
  preferLiveConversations,
  upsertConversationRow,
} from "./whatsappLiveApply.ts";
import type { WhatsappConversation, WhatsappMessage } from "@/services/whatsapp/types";
import type { SupportMessage } from "@/features/admin/components/support/supportDummyData";

function conv(
  patch: Partial<WhatsappConversation> & { id: string },
): WhatsappConversation {
  return {
    kapso_conversation_id: null,
    phone_number: "201000",
    contact_name: "Pat",
    patient_key: null,
    status: "active",
    last_message_at: "2026-09-08T10:00:00.000Z",
    last_inbound_at: null,
    last_message_preview: "old",
    last_message_type: "text",
    last_message_status: "received",
    unread_count: 0,
    metadata: {},
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-08T10:00:00.000Z",
    ...patch,
  };
}

function msg(
  patch: Partial<WhatsappMessage> & { id: string; conversation_id: string },
): WhatsappMessage {
  return {
    kapso_wamid: null,
    direction: "inbound",
    body: "hello",
    message_type: "text",
    status: "received",
    sent_by: null,
    raw: {},
    media: [],
    flow: null,
    reply_to: null,
    status_timestamps: {},
    wa_timestamp: "2026-09-08T12:00:00.000Z",
    created_at: "2026-09-08T12:00:00.000Z",
    updated_at: "2026-09-08T12:00:00.000Z",
    ...patch,
  };
}

function supportMsg(
  patch: Partial<SupportMessage> & { id: string },
): SupportMessage {
  return {
    author: "customer",
    authorName: "Pat",
    body: "x",
    time: "12:00",
    waTimestamp: "2026-09-08T11:00:00.000Z",
    ...patch,
  };
}

describe("whatsappLiveApply", () => {
  it("moves an updated conversation to the front", () => {
    const rows = [
      conv({ id: "a", last_message_preview: "a" }),
      conv({ id: "b", last_message_preview: "b" }),
    ];
    const next = upsertConversationRow(
      rows,
      conv({
        id: "b",
        last_message_preview: "new",
        last_message_at: "2026-09-08T13:00:00.000Z",
      }),
    );
    assert.equal(next[0]?.id, "b");
    assert.equal(next[0]?.last_message_preview, "new");
    assert.equal(next.length, 2);
  });

  it("patches preview from an inbound message without changing unread", () => {
    const rows = [conv({ id: "c1", unread_count: 1 })];
    const next = patchConversationsFromMessage(
      rows,
      msg({
        id: "m1",
        conversation_id: "c1",
        body: "hi from phone",
        direction: "inbound",
      }),
    );
    assert.equal(next[0]?.last_message_preview, "hi from phone");
    assert.equal(next[0]?.unread_count, 1);
    assert.equal(next[0]?.last_inbound_at, "2026-09-08T12:00:00.000Z");
  });

  it("does not bump unread for outbound messages", () => {
    const rows = [conv({ id: "c1", unread_count: 1 })];
    const next = patchConversationsFromMessage(
      rows,
      msg({
        id: "m1",
        conversation_id: "c1",
        body: "from desk",
        direction: "outbound",
      }),
    );
    assert.equal(next[0]?.unread_count, 1);
    assert.equal(next[0]?.last_message_preview, "from desk");
  });

  /**
   * An AI draft is written into whatsapp_messages so it reaches the realtime
   * inbox, but it was never delivered. If it set the conversation preview,
   * staff would see text in the inbox list that the patient never received —
   * a failure with no visible symptom.
   */
  it("ignores an AI draft entirely when patching the conversation", () => {
    const rows = [
      conv({
        id: "c1",
        unread_count: 2,
        last_message_preview: "real last message",
        last_message_status: "delivered",
      }),
    ];
    const next = patchConversationsFromMessage(
      rows,
      msg({
        id: "m-draft",
        conversation_id: "c1",
        body: "AI suggested reply",
        direction: "outbound",
        status: "draft",
      }),
    );
    assert.equal(next[0]?.last_message_preview, "real last message");
    assert.equal(next[0]?.last_message_status, "delivered");
    assert.equal(next[0]?.unread_count, 2);
  });

  it("keeps realtime messages when a fetched page is older", () => {
    const fetched = [
      supportMsg({ id: "m1", body: "old", waTimestamp: "2026-09-08T11:00:00.000Z" }),
    ];
    const live = [
      supportMsg({ id: "m1", body: "old" }),
      supportMsg({
        id: "m2",
        body: "live",
        waTimestamp: "2026-09-08T12:00:00.000Z",
      }),
    ];
    const merged = mergeSupportMessages(fetched, live);
    assert.deepEqual(
      merged.map((m) => m.id),
      ["m1", "m2"],
    );
  });

  it("keeps live rows when a stale server seed arrives", () => {
    const seed = [
      conv({
        id: "a",
        last_message_preview: "old",
        updated_at: "2026-09-08T10:00:00.000Z",
      }),
    ];
    const live = [
      conv({
        id: "a",
        last_message_preview: "from phone",
        updated_at: "2026-09-08T12:00:00.000Z",
      }),
    ];
    const next = preferLiveConversations(seed, live);
    assert.equal(next[0]?.last_message_preview, "from phone");
  });

  it("takes a newer server seed after a full refresh", () => {
    const live = [
      conv({
        id: "a",
        last_message_preview: "old live",
        updated_at: "2026-09-08T10:00:00.000Z",
      }),
    ];
    const seed = [
      conv({
        id: "a",
        last_message_preview: "from refresh",
        updated_at: "2026-09-08T13:00:00.000Z",
      }),
    ];
    const next = preferLiveConversations(seed, live);
    assert.equal(next[0]?.last_message_preview, "from refresh");
  });
});
