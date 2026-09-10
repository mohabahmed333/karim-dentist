import assert from "node:assert/strict";
import test from "node:test";
import {
  WHATSAPP_FIXTURE_CONVERSATIONS,
  countFixtureMessages,
  fixtureMessageTypes,
  reservationStatusesPresent,
  CLINICAL_AI_FIXTURE,
  COMMAND_SEARCH_FIXTURE,
  DASHBOARD_FIXTURE,
  CUSTOMIZE_TRANSLATE_FIXTURE,
  SITE_TO_CHAT_FIXTURE,
  WHATSAPP_SHOWREEL_SCRIPT,
} from "./index.ts";

test("seeds at least 8 WhatsApp conversations", () => {
  assert.ok(WHATSAPP_FIXTURE_CONVERSATIONS.length >= 8);
});

test("seeds enough fake WhatsApp messages with required types", () => {
  assert.ok(countFixtureMessages() >= 20);
  const types = fixtureMessageTypes();
  for (const required of [
    "text",
    "image",
    "audio",
    "document",
    "interactive",
    "location",
  ]) {
    assert.ok(types.has(required), `missing message type ${required}`);
  }
});

test("includes unread inbound for showreel WhatsApp scene", () => {
  const unread = WHATSAPP_FIXTURE_CONVERSATIONS.find((c) => c.unread);
  assert.ok(unread);
  assert.equal(unread.id, WHATSAPP_SHOWREEL_SCRIPT.conversationId);
});

test("reservation fixtures cover clinic statuses", () => {
  const statuses = reservationStatusesPresent();
  for (const s of [
    "pending",
    "confirmed",
    "cancelled",
    "completed",
    "no_show",
  ]) {
    assert.ok(statuses.has(s), `missing status ${s}`);
  }
});

test("clinical AI fixture requires human review gate", () => {
  assert.match(CLINICAL_AI_FIXTURE.reviewGateLabel, /review/i);
  assert.ok(CLINICAL_AI_FIXTURE.caseSummary.findings.length > 0);
});

test("command search and dashboard fixtures are populated", () => {
  assert.ok(COMMAND_SEARCH_FIXTURE.hits.length >= 3);
  assert.equal(COMMAND_SEARCH_FIXTURE.aiUsed, true);
  assert.ok(DASHBOARD_FIXTURE.kpis.length >= 3);
  assert.equal(CUSTOMIZE_TRANSLATE_FIXTURE.rtlAfter, false);
  assert.ok(CUSTOMIZE_TRANSLATE_FIXTURE.heroEdit.headline.includes("live edit"));
  assert.ok(CUSTOMIZE_TRANSLATE_FIXTURE.heroAfter.cta.length > 0);
});

test("site-to-chat fixture aligns Sara / whitening / Tue 10:30", () => {
  assert.equal(SITE_TO_CHAT_FIXTURE.patientName, "Sara Hassan");
  assert.match(SITE_TO_CHAT_FIXTURE.slotLabel, /Tue 10:30/);
  assert.match(SITE_TO_CHAT_FIXTURE.serviceLabel, /whitening/i);
  assert.ok(SITE_TO_CHAT_FIXTURE.inboundBody.includes("website"));
  assert.ok(SITE_TO_CHAT_FIXTURE.confirmBody.includes("10:30"));
});
