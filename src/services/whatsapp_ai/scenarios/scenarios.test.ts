import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { extractAutoReplyEnvelope } from "../extractAutoReplyEnvelope.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { decideAutoReply } from "../decideAutoReply.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { injectionHeuristics } from "../injectionHeuristics.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { wantsHuman } from "../humanRequest.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { claimsCompletedBooking, stripInternalIds } from "../replyGuards.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { nextBookingState } from "../bookingState.ts";
import {
  DECISION_SCENARIOS,
  MEMORY_SCENARIOS,
  RES_OWN,
  SLOT_OFFERED,
  // @ts-expect-error -- Node strip-types needs the extension.
} from "./fixtures.ts";

const OFFERED_SLOTS = [{ id: SLOT_OFFERED, starts_at: "2026-09-11T07:30:00.000Z" }];

/**
 * Mirrors the order runAutoReply applies its gates in, so a scenario failing
 * here means production would behave the same way.
 */
function evaluate(scenario: (typeof DECISION_SCENARIOS)[number]) {
  if (wantsHuman(scenario.patient)) return { action: "human", reason: "human_requested" };

  const raw =
    typeof scenario.model === "string" ? scenario.model : JSON.stringify(scenario.model);
  const { envelope: rawEnvelope } = extractAutoReplyEnvelope(raw);
  const envelope = { ...rawEnvelope, reply: stripInternalIds(rawEnvelope.reply).reply };

  const decision = decideAutoReply({
    envelope,
    injectionFlags: injectionHeuristics(scenario.patient),
    offeredSlotIds: [SLOT_OFFERED],
    ownReservationIds: [RES_OWN],
    allowBookingWrites: scenario.allowBookingWrites ?? false,
  });

  if (
    decision.action === "auto_send" &&
    decision.actions.length === 0 &&
    claimsCompletedBooking(envelope.reply)
  ) {
    return { action: "draft", reason: "false_confirmation" };
  }
  return { action: decision.action, reason: decision.reason };
}

describe("scenarios — what the assistant must do", () => {
  for (const scenario of DECISION_SCENARIOS) {
    it(`${scenario.id}: ${scenario.patient.slice(0, 48)}`, () => {
      const outcome = evaluate(scenario);
      assert.equal(outcome.action, scenario.expect.action, `${scenario.id} action`);
      if (scenario.expect.reason) {
        assert.equal(outcome.reason, scenario.expect.reason, `${scenario.id} reason`);
      }
    });
  }
});

describe("scenarios — what the assistant must remember", () => {
  for (const scenario of MEMORY_SCENARIOS) {
    it(scenario.id, () => {
      const state = nextBookingState(
        { step: "idle", pending: { ...scenario.prior }, expiresAt: null },
        {
          collected: scenario.collected,
          offeredSlots: OFFERED_SLOTS,
          bookingCompleted: scenario.bookingCompleted ?? false,
          now: new Date("2026-09-10T22:00:00.000Z"),
        },
      );
      for (const [field, expected] of Object.entries(scenario.expectPending)) {
        assert.equal(state.pending[field], expected, `${scenario.id}.${field}`);
      }
    });
  }
});

/** Stops the suite rotting into duplicates or a group quietly emptying out. */
describe("scenarios — integrity", () => {
  it("gives every scenario a unique id", () => {
    const ids = [...DECISION_SCENARIOS, ...MEMORY_SCENARIOS].map((s) => s.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it("keeps every group populated", () => {
    for (const group of ["safety", "booking", "adversarial", "knowledge", "arabic"]) {
      const count = DECISION_SCENARIOS.filter((s) => s.group === group).length;
      assert.ok(count >= 10, `${group} has only ${count} scenarios`);
    }
  });

  it("covers at least 100 scenarios in total", () => {
    assert.ok(
      DECISION_SCENARIOS.length + MEMORY_SCENARIOS.length >= 100,
      `only ${DECISION_SCENARIOS.length + MEMORY_SCENARIOS.length}`,
    );
  });
});
