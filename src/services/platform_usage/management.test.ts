import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { resolveProjectRef } from "./management.ts";

test("resolves the project ref from env or the Supabase URL", () => {
  assert.equal(
    resolveProjectRef({
      projectId: "puibdsyokgjdvkkousil",
      url: "https://other.supabase.co",
    }),
    "puibdsyokgjdvkkousil",
  );
  assert.equal(
    resolveProjectRef({
      projectId: " ",
      url: "https://abcdref.supabase.co",
    }),
    "abcdref",
  );
  assert.equal(resolveProjectRef({ projectId: "", url: "" }), null);
});
