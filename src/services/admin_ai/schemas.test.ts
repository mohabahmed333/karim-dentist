import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import {
  createProposalInputSchema,
  fdiSchema,
  proposedActionSchema,
} from "./schemas.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import {
  isProposalExpired,
  orderActions,
  snapshotHash,
} from "./proposalUtils.ts";

describe("admin_ai schemas", () => {
  it("accepts valid FDI and rejects bad ones", () => {
    assert.equal(fdiSchema.parse("16"), "16");
    assert.throws(() => fdiSchema.parse("99"));
    assert.throws(() => fdiSchema.parse("1"));
  });

  it("allowlists action kinds only", () => {
    assert.throws(() =>
      proposedActionSchema.parse({
        id: "a1",
        kind: "sql.drop_all",
        label: "Bad",
        payload: {},
      }),
    );
    const ok = proposedActionSchema.parse({
      id: "a1",
      kind: "chart.set_surfaces",
      label: "Mark decay on 16",
      payload: { patientKey: "p1", fdi: "16", occlusal: "decay" },
    });
    assert.equal(ok.kind, "chart.set_surfaces");
  });

  it("requires at least one action in a proposal", () => {
    assert.throws(() =>
      createProposalInputSchema.parse({
        summary: "empty",
        actions: [],
      }),
    );
  });
});

describe("admin_ai proposal utils", () => {
  it("hashes snapshots stably", () => {
    const a = snapshotHash({ hero: { title: "A" }, about: { blurb: "B" } });
    const b = snapshotHash({ about: { blurb: "B" }, hero: { title: "A" } });
    const c = snapshotHash({ hero: { title: "Z" }, about: { blurb: "B" } });
    assert.equal(a, b);
    assert.notEqual(a, c);
  });

  it("orders actions by dependsOn", () => {
    const ordered = orderActions([
      {
        id: "treat",
        kind: "treatment.create",
        label: "Treat 16",
        dependsOn: ["chart"],
        payload: {},
      },
      {
        id: "chart",
        kind: "chart.set_surfaces",
        label: "Chart 16",
        dependsOn: [],
        payload: {},
      },
      {
        id: "book",
        kind: "followup.book",
        label: "Book",
        dependsOn: ["treat"],
        payload: {},
      },
    ]);
    assert.deepEqual(
      ordered.map((a) => a.id),
      ["chart", "treat", "book"],
    );
  });

  it("rejects cycles and missing deps", () => {
    assert.throws(() =>
      orderActions([
        {
          id: "a",
          kind: "note.general",
          label: "A",
          dependsOn: ["b"],
          payload: {},
        },
        {
          id: "b",
          kind: "note.general",
          label: "B",
          dependsOn: ["a"],
          payload: {},
        },
      ]),
    );
    assert.throws(() =>
      orderActions([
        {
          id: "a",
          kind: "note.general",
          label: "A",
          dependsOn: ["missing"],
          payload: {},
        },
      ]),
    );
  });

  it("detects expired proposals", () => {
    assert.equal(isProposalExpired("2000-01-01T00:00:00.000Z"), true);
    assert.equal(isProposalExpired("2999-01-01T00:00:00.000Z"), false);
  });
});
