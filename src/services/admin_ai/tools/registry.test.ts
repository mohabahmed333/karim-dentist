import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { createFakeDb } from "../testing/fakeDb.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { CLINIC_ASSIST_TOOLS, runTool } from "./registry.ts";

describe("CLINIC_ASSIST_TOOLS", () => {
  it("names every tool with a one-line description", () => {
    for (const [name, tool] of Object.entries(CLINIC_ASSIST_TOOLS)) {
      assert.ok(tool.description.length > 0, name);
    }
  });
});

describe("runTool", () => {
  const db = createFakeDb({ tables: { reservations: [] } });

  it("reports an unknown tool name and lists what is available", async () => {
    const out = await runTool(db as never, "delete_everything", {});
    assert.equal(out.ok, false);
    if (out.ok) return;
    assert.match(out.error, /Unknown tool/);
    assert.match(out.error, /search_patients/);
  });

  it("rejects arguments that fail the tool's schema, with a readable reason", async () => {
    const out = await runTool(db as never, "search_patients", {});
    assert.equal(out.ok, false);
    if (out.ok) return;
    assert.match(out.error, /search_patients/);
  });

  it("runs a known tool with valid arguments", async () => {
    const out = await runTool(db as never, "search_patients", { query: "Ali" });
    assert.equal(out.ok, true);
    if (!out.ok) return;
    assert.deepEqual(out.data, []);
  });

  it("wraps a tool that throws as a failure instead of crashing the turn", async () => {
    const failingDb = createFakeDb({ failOn: { "reservations.select": { message: "db down" } } });
    const out = await runTool(failingDb as never, "search_patients", { query: "Ali" });
    assert.equal(out.ok, false);
    if (out.ok) return;
    assert.match(out.error, /db down/);
  });

  it("defaults missing args to an empty object rather than throwing", async () => {
    const out = await runTool(db as never, "search_patients", undefined);
    assert.equal(out.ok, false);
  });
});
