import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { collectRequiredTemplates, tallyTemplates } from "./requiredTemplates.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { PATIENT_TEMPLATES } from "./templates.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { TEMPLATE_PROPOSALS } from "./templateProposals.ts";

const ALL_APPROVED = PATIENT_TEMPLATES.map((t: { name: string }) => t.name);

describe("collectRequiredTemplates", () => {
  it("covers every template in the code and every one still to submit", () => {
    const rows = collectRequiredTemplates(ALL_APPROVED);
    assert.equal(rows.length, PATIENT_TEMPLATES.length + TEMPLATE_PROPOSALS.length * 2);
  });

  it("marks the ones Meta approved", () => {
    const rows = collectRequiredTemplates(ALL_APPROVED);
    for (const name of ALL_APPROVED) {
      assert.equal(rows.find((r: { name: string }) => r.name === name)?.status, "approved", name);
    }
  });

  it("marks a registered template Meta does not list as missing, not absent", () => {
    // It exists in the code, so the fix is to chase Meta rather than write text.
    const rows = collectRequiredTemplates([]);
    const registered = rows.filter((r: { proposal: unknown }) => r.proposal === null);
    assert.ok(registered.length > 0);
    for (const row of registered) assert.equal(row.status, "missing");
  });

  it("says unknown when Meta could not be asked", () => {
    // Not having looked is not the same as having looked and found nothing.
    const rows = collectRequiredTemplates(null);
    const registered = rows.filter((r: { proposal: unknown }) => r.proposal === null);
    for (const row of registered) assert.equal(row.status, "unknown");
  });

  it("carries the text to submit for anything not yet created", () => {
    const rows = collectRequiredTemplates(ALL_APPROVED);
    const pending = rows.filter((r: { status: string }) => r.status === "not_submitted");
    assert.equal(pending.length, TEMPLATE_PROPOSALS.length * 2);
    for (const row of pending) {
      assert.ok(row.proposal, row.name);
      assert.ok(row.proposal.bodyEn && row.proposal.bodyAr, row.name);
    }
  });

  it("lists both languages of every proposal", () => {
    const rows = collectRequiredTemplates(ALL_APPROVED);
    for (const proposal of TEMPLATE_PROPOSALS) {
      assert.ok(rows.some((r: { name: string }) => r.name === proposal.names.en), proposal.kind);
      assert.ok(rows.some((r: { name: string }) => r.name === proposal.names.ar), proposal.kind);
    }
  });

  it("puts the work first and the working last", () => {
    const rows = collectRequiredTemplates(ALL_APPROVED);
    const statuses = rows.map((r: { status: string }) => r.status);
    assert.equal(statuses[0], "not_submitted");
    assert.equal(statuses.at(-1), "approved");
  });

  it("names a template by the message it carries, as the checklist does", () => {
    const rows = collectRequiredTemplates(ALL_APPROVED);
    const reminder = rows.find((r: { kind: string }) => r.kind === "reminder_24h");
    assert.equal(reminder?.title, "Day-before reminders");
  });

  it("keeps the body language, which is not the Meta language", () => {
    // Two approved templates have their language suffix the wrong way round
    // and are registered under en_US regardless; the body is what matters.
    const rows = collectRequiredTemplates(ALL_APPROVED);
    const reminderEn = rows.find((r: { name: string }) => r.name === "reminder_en");
    assert.equal(reminderEn?.bodyLanguage, "ar");
  });
});

describe("tallyTemplates", () => {
  it("counts each state", () => {
    const tally = tallyTemplates(collectRequiredTemplates(ALL_APPROVED));
    assert.equal(tally.approved, PATIENT_TEMPLATES.length);
    assert.equal(tally.not_submitted, TEMPLATE_PROPOSALS.length * 2);
    assert.equal(tally.missing, 0);
  });

  it("counts nothing as approved when Meta could not be asked", () => {
    const tally = tallyTemplates(collectRequiredTemplates(null));
    assert.equal(tally.approved, 0);
    assert.equal(tally.unknown, PATIENT_TEMPLATES.length);
  });
});
