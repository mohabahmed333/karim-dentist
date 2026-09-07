import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error -- Node's strip-types runner requires the explicit extension.
import { detailPageIdsFromCounts } from "./sectionIds.ts";

test("treats a slug as enough to open a public detail page", () => {
  const ids = detailPageIdsFromCounts(
    [
      { id: "a", slug: "hero-reel-frame" },
      { id: "b", slug: null },
    ],
    {},
  );
  assert.deepEqual(ids, ["a"]);
});
