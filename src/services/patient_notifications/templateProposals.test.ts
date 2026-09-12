import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { TEMPLATE_PROPOSALS, proposalForKind } from "./templateProposals.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { PATIENT_TEMPLATES } from "./templates.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { templateCondition, NO_TEMPLATE_LABEL } from "./featureConditions.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { templateProposalsMarkdown } from "./templateProposals.ts";
import { readFileSync } from "node:fs";

const placeholders = (body: string) =>
  [...body.matchAll(/\{\{(\d+)\}\}/g)].map((m) => Number(m[1]));

describe("template proposals", () => {
  it("covers every message type that has no template yet, and nothing else", () => {
    const approved = new Set(PATIENT_TEMPLATES.map((t: { kind: string }) => t.kind));
    const proposed = TEMPLATE_PROPOSALS.map((p: { kind: string }) => p.kind);
    assert.deepEqual(proposed, [
      "cancellation", "reschedule", "waitlist_offer", "followup", "recall_6m", "review_request",
    ]);
    // A kind that already has a template must not also be proposed.
    for (const kind of proposed) assert.equal(approved.has(kind), false, kind);
  });

  it("numbers placeholders 1..n with no gaps, matching the listed parameters", () => {
    // Meta rejects a template whose placeholders skip a number.
    for (const p of TEMPLATE_PROPOSALS) {
      for (const body of [p.bodyEn, p.bodyAr]) {
        const used = [...new Set(placeholders(body))].sort((a, b) => a - b);
        assert.deepEqual(
          used,
          p.params.map((_: string, i: number) => i + 1),
          `${p.kind}: ${body}`,
        );
      }
    }
  });

  it("uses the same placeholders in both languages", () => {
    for (const p of TEMPLATE_PROPOSALS) {
      assert.deepEqual(
        [...new Set(placeholders(p.bodyEn))].sort(),
        [...new Set(placeholders(p.bodyAr))].sort(),
        p.kind,
      );
    }
  });

  it("proposes names Meta will accept", () => {
    // Meta allows lowercase letters, digits and underscores only.
    for (const p of TEMPLATE_PROPOSALS) {
      for (const name of [p.names.en, p.names.ar]) {
        assert.match(name, /^[a-z0-9_]+$/, name);
      }
      assert.ok(p.names.en.endsWith("_en") && p.names.ar.endsWith("_ar"), p.kind);
    }
  });

  it("marks the two marketing templates as marketing", () => {
    // Meta treats these differently, and they need consent.
    const marketing = TEMPLATE_PROPOSALS.filter((p: { category: string }) => p.category === "MARKETING");
    assert.deepEqual(marketing.map((p: { kind: string }) => p.kind), ["recall_6m", "review_request"]);
  });

  it("finds a proposal by message type, and nothing for one that is already set up", () => {
    assert.equal(proposalForKind("followup")?.names.en, "followup_en");
    assert.equal(proposalForKind("confirmation"), null);
    assert.equal(proposalForKind("nonsense"), null);
  });
});

describe("the missing-template condition", () => {
  const facts = { approvedTemplateNames: [] } as never;

  it("says the template was never submitted, rather than never approved", () => {
    // The old wording read as "approved and added", which staff read as a
    // Meta approval problem when in fact nothing had been submitted at all.
    assert.equal(NO_TEMPLATE_LABEL, "No template submitted for this message");
  });

  it("carries the text to submit, so Settings never leaves staff guessing", () => {
    for (const p of TEMPLATE_PROPOSALS) {
      const condition = templateCondition(p.kind, facts);
      assert.equal(condition.label, NO_TEMPLATE_LABEL, p.kind);
      assert.equal(condition.proposal?.names.en, p.names.en);
    }
  });

  it("carries no proposal for a message type that already has a template", () => {
    assert.equal(templateCondition("confirmation", facts).proposal, undefined);
  });
});

describe("the runbook", () => {
  it("lists exactly what the code proposes", () => {
    // One list, two readers. Regenerate with:
    //   yarn tsx scripts/write-template-proposals.ts
    const doc = readFileSync("docs/PATIENT_NOTIFICATIONS.md", "utf8");
    const block = doc.split("<!-- generated:template-proposals -->")[1]?.split("<!-- /generated -->")[0];
    assert.ok(block, "the generated block is missing from docs/PATIENT_NOTIFICATIONS.md");
    assert.equal(block.trim(), templateProposalsMarkdown().trim());
  });
});
