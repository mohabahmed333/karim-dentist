import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { pickConversation, resolveOrCreateConversation } from "./resolveConversation.ts";

const conv = (id: string, phone_number: string, updated_at: string) => ({
  id,
  phone_number,
  updated_at,
});

describe("pickConversation", () => {
  it("matches the same number written in a different shape", () => {
    // The suffix query is only a prefilter; phonesMatch makes the real call.
    const found = pickConversation(
      [conv("c1", "201005551234", "2026-01-01T00:00:00Z")],
      "+20 100 555 1234",
    );
    assert.equal(found?.id, "c1");
  });

  it("expands a local Egyptian number the way canonicalPhoneDigits does", () => {
    const found = pickConversation(
      [conv("c1", "201005551234", "2026-01-01T00:00:00Z")],
      "0100 555 1234",
    );
    assert.equal(found?.id, "c1");
  });

  it("prefers the most recently active conversation when a number has two", () => {
    const found = pickConversation(
      [
        conv("old", "201005551234", "2026-01-01T00:00:00Z"),
        conv("new", "+201005551234", "2026-06-01T00:00:00Z"),
      ],
      "201005551234",
    );
    assert.equal(found?.id, "new");
  });

  it("rejects a suffix collision from a different country", () => {
    // The SQL prefilter matches on the last 8 digits alone, so two unrelated
    // numbers can arrive here. Sending one patient's appointment to another is
    // exactly the failure this guards.
    const found = pickConversation(
      [conv("other", "447700905551234", "2026-01-01T00:00:00Z")],
      "201005551234",
    );
    assert.equal(found, null);
  });

  it("returns null for an empty candidate list", () => {
    assert.equal(pickConversation([], "201005551234"), null);
  });
});

describe("resolveOrCreateConversation", () => {
  function deps(candidates: ReturnType<typeof conv>[] = []) {
    const created: Record<string, unknown>[] = [];
    return {
      created,
      calls: [] as string[],
      async findBySuffix(suffix: string) {
        this.calls.push(`find:${suffix}`);
        return candidates;
      },
      async create(input: Record<string, unknown>) {
        created.push(input);
        return { id: "created-1" };
      },
    };
  }

  it("reuses an existing conversation rather than starting a second thread", async () => {
    const d = deps([conv("c1", "201005551234", "2026-01-01T00:00:00Z")]);
    const id = await resolveOrCreateConversation(d, {
      phone: "+201005551234",
      patientName: "Ahmed",
    });
    assert.equal(id, "c1");
    assert.equal(d.created.length, 0);
  });

  it("narrows on the indexed suffix, not the whole table", async () => {
    const d = deps([]);
    await resolveOrCreateConversation(d, { phone: "+20 100 555 1234", patientName: "A" });
    assert.deepEqual(d.calls, ["find:05551234"]);
  });

  it("creates one in the digit shape Kapso reports, so a reply finds it again", async () => {
    const d = deps([]);
    const id = await resolveOrCreateConversation(d, {
      phone: "0100 555 1234",
      patientName: "Ahmed",
    });
    assert.equal(id, "created-1");
    // Kapso reports `from` as bare digits with the country code, and
    // upsertConversationFromKapso still falls back to an exact match on
    // phone_number. Storing "+2010…" here would fork the thread on first reply.
    assert.equal(d.created[0].phone_number, "201005551234");
    assert.equal(d.created[0].contact_name, "Ahmed");
    assert.equal(d.created[0].status, "active");
  });

  it("never sets last_inbound_at — that would forge an open 24h window", async () => {
    const d = deps([]);
    await resolveOrCreateConversation(d, { phone: "+201005551234", patientName: "A" });
    // isWhatsappSessionOpen reads last_inbound_at. Setting it here would let
    // free text out to someone who has never messaged the clinic, which Meta
    // treats as a policy violation.
    assert.equal("last_inbound_at" in d.created[0], false);
  });

  it("refuses a phone number with no digits instead of creating a junk row", async () => {
    const d = deps([]);
    await assert.rejects(
      () => resolveOrCreateConversation(d, { phone: "not a phone", patientName: "A" }),
      /phone/i,
    );
    assert.equal(d.created.length, 0);
  });
});
