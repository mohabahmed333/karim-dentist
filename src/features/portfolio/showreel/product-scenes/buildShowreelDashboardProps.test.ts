import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_DASHBOARD_LAYOUT } from "@/features/admin/lib/dashboardLayout";
import { buildShowreelDashboardProps } from "./buildShowreelDashboardProps";
import {
  SHOWREEL_AI_BOOKING_CURSOR_STEPS,
  SHOWREEL_CLINICAL_CURSOR_STEPS,
  SHOWREEL_DASHBOARD_CURSOR_STEPS,
  SHOWREEL_SMART_UX_CURSOR_STEPS,
  SHOWREEL_WHATSAPP_CURSOR_STEPS,
  resolveShowreelCursorTarget,
  showreelCursorStepIds,
} from "./showreelCursorTimeline";
import { SHOWREEL_SITE_TO_CHAT_CURSOR_STEPS } from "./showreelSiteToChatTimeline";

test("showreel dashboard uses the full default layout", () => {
  const props = buildShowreelDashboardProps();
  assert.deepEqual(
    props.initialLayout.map((w) => w.id),
    DEFAULT_DASHBOARD_LAYOUT.map((w) => w.id),
  );
  assert.ok(props.initialLayout.some((w) => w.id === "daySchedule"));
  assert.ok(props.initialLayout.some((w) => w.id === "messages"));
  assert.ok(props.initialLayout.some((w) => w.id === "chartDayTrend"));
});

test("dashboard cursor timeline covers schedule, charts, then whatsapp flow", () => {
  const ids = showreelCursorStepIds();
  assert.deepEqual(ids, [
    "scroll-schedule",
    "scroll-charts",
    "hold-charts",
    "scroll-messages",
    "click-front-desk",
    "wait-whatsapp",
    "hold-whatsapp",
  ]);
  const times = SHOWREEL_DASHBOARD_CURSOR_STEPS.map((s) => s.at);
  for (let i = 1; i < times.length; i += 1) {
    assert.ok(times[i]! > times[i - 1]!);
  }
  assert.ok(SHOWREEL_DASHBOARD_CURSOR_STEPS.every((s) => s.at < 18_000));
});

test("cursor target resolver returns null for missing selectors", () => {
  const root = {
    querySelector: () => null,
  } as unknown as ParentNode;
  assert.equal(
    resolveShowreelCursorTarget(root, '[data-showreel-action="x"]'),
    null,
  );
});

test("smart-ux / clinical / ai-booking / whatsapp cursor timelines are ordered", () => {
  const packs = [
    SHOWREEL_SMART_UX_CURSOR_STEPS,
    SHOWREEL_CLINICAL_CURSOR_STEPS,
    SHOWREEL_AI_BOOKING_CURSOR_STEPS,
    SHOWREEL_WHATSAPP_CURSOR_STEPS,
  ];
  for (const steps of packs) {
    const times = steps.map((s) => s.at);
    for (let i = 1; i < times.length; i += 1) {
      assert.ok(times[i]! > times[i - 1]!);
    }
  }
  assert.deepEqual(showreelCursorStepIds(SHOWREEL_SMART_UX_CURSOR_STEPS), [
    "open-command",
    "type-query",
    "demo-hits",
    "select-page",
    "wait-page",
    "open-fab",
    "wait-chooser",
    "open-whatsapp",
    "wait-composer",
    "compose-message",
    "send-message",
    "hold-sent",
    "toggle-dock",
    "collapse-dock",
    "hold-collapsed",
  ]);
  assert.deepEqual(showreelCursorStepIds(SHOWREEL_CLINICAL_CURSOR_STEPS), [
    "focus-chart",
    "select-tooth",
    "wait-composer",
    "compose-note",
    "attach-images",
    "wait-uploads",
    "send-note",
    "wait-review",
    "scroll-summary",
    "review-apply",
    "open-details",
    "hold-details",
  ]);
  assert.deepEqual(showreelCursorStepIds(SHOWREEL_AI_BOOKING_CURSOR_STEPS), [
    "wait-assist",
    "focus-composer",
    "review-card",
    "confirm-review",
    "hold-created",
    "type-followup",
    "send-followup",
    "hold-followup",
  ]);
  assert.deepEqual(showreelCursorStepIds(SHOWREEL_WHATSAPP_CURSOR_STEPS), [
    "wait-whatsapp",
    "wait-thread",
    "open-workspace",
    "wait-workspace",
    "open-quick-replies",
    "wait-quick-replies",
    "send-slots",
    "open-book",
    "wait-book-card",
    "confirm-book",
    "hold-confirmed",
    "start-voice",
    "hold-voice",
    "send-voice",
    "close-chat",
    "hold-closed",
  ]);
  assert.deepEqual(showreelCursorStepIds(SHOWREEL_SITE_TO_CHAT_CURSOR_STEPS), [
    "scroll-booking",
    "fill-name",
    "fill-phone",
    "fill-service",
    // "pick-date" replaced "wait-slots": booking-date has a real onClick
    // that selects the date, and slot buttons don't render until a date is
    // selected — a plain wait let pick-slot's selector match nothing.
    "pick-date",
    "pick-slot",
    "scroll-submit",
    "submit-booking",
    "wait-success",
    "hold-reservation",
    "open-frontdesk",
    "wait-frontdesk",
    "open-thread",
    "wait-thread",
    "compose-reply",
    "send-reply",
    "hold-replied",
    "open-nour",
    "hold-nour",
    "open-youssef",
    "hold-youssef",
    "open-mariam",
    "hold-mariam",
    "hold-end",
  ]);
});
