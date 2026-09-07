import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { splitHeroAccent } from "./splitHeroAccent.ts";

test("keeps explicit accent and full headline before", () => {
  assert.deepEqual(
    splitHeroAccent("Caring for Your ", "Smile", "Smile"),
    { before: "Caring for Your ", accent: "Smile", after: "" },
  );
});

test("splits a combined CMS headline around the accent word", () => {
  assert.deepEqual(
    splitHeroAccent(
      "Caring for Your Smile, One Visit at a Time.",
      "",
      "Smile",
    ),
    {
      before: "Caring for Your ",
      accent: "Smile",
      after: ", One Visit at a Time.",
    },
  );
});

test("leaves headline alone when accent word is missing", () => {
  assert.deepEqual(splitHeroAccent("Hello clinic", "", "Smile"), {
    before: "Hello clinic",
    accent: "",
    after: "",
  });
});
