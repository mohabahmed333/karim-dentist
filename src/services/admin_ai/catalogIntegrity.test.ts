import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { actionKindSchema } from "./schemas.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { listActionKinds } from "./registry.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { WRITE_ACTION_KINDS } from "./writeKinds.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { ADMIN_AI_ACTION_CATALOG } from "./actionCatalog.ts";

/**
 * An action kind has to be declared in four places that are kept in sync by
 * hand: the zod enum, the adapter registry, the write classification, and the
 * prose catalog injected into the model's system prompt. Drift between them
 * fails at different layers and in confusing ways — a kind missing from the
 * catalog is simply never proposed; a kind missing from the registry throws at
 * confirm time, after the doctor has already clicked. These tests make drift a
 * CI failure instead.
 */
describe("action catalog integrity", () => {
  const declared = actionKindSchema.options as string[];
  const registered = listActionKinds() as string[];

  it("declares at least the kinds we know shipped", () => {
    assert.ok(declared.length >= 19, `only ${declared.length} kinds declared`);
  });

  it("has exactly one adapter per declared kind, and no extras", () => {
    assert.deepEqual(
      [...registered].sort(),
      [...declared].sort(),
      "registry and actionKindSchema disagree",
    );
  });

  it("registers no kind twice", () => {
    assert.equal(
      new Set(registered).size,
      registered.length,
      "duplicate adapter registered",
    );
  });

  it("classifies every kind as write or not, with no unknown entries", () => {
    for (const kind of [...WRITE_ACTION_KINDS] as string[]) {
      assert.ok(
        declared.includes(kind),
        `WRITE_ACTION_KINDS has unknown kind: ${kind}`,
      );
    }
  });

  it("documents every write kind in the prompt catalog", () => {
    // A write the model is never told about can never be proposed.
    for (const kind of [...WRITE_ACTION_KINDS] as string[]) {
      assert.ok(
        ADMIN_AI_ACTION_CATALOG.includes(kind),
        `${kind} is a write but is absent from ADMIN_AI_ACTION_CATALOG`,
      );
    }
  });

  it("mentions only real kinds in the prompt catalog", () => {
    // Guards against a stale catalog line the model would try to emit.
    const mentioned = ADMIN_AI_ACTION_CATALOG.match(/^- ([a-z_]+\.[a-z_]+)/gm) ?? [];
    for (const line of mentioned) {
      const kind = line.replace(/^- /, "");
      assert.ok(
        declared.includes(kind),
        `catalog documents unknown kind: ${kind}`,
      );
    }
  });

  it("exposes a working adapter for every kind", async () => {
    const { getAdapter } = await import("./registry.ts");
    for (const kind of declared) {
      const adapter = getAdapter(kind);
      assert.equal(adapter.kind, kind);
      assert.equal(typeof adapter.preview, "function", `${kind}.preview`);
      assert.equal(typeof adapter.execute, "function", `${kind}.execute`);
      assert.equal(
        adapter.write,
        WRITE_ACTION_KINDS.has(kind),
        `${kind}: adapter.write disagrees with WRITE_ACTION_KINDS`,
      );
    }
  });
});
