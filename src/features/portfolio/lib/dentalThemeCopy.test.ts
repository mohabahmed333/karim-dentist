import assert from "node:assert/strict";
import test from "node:test";
import { resolveDentalHeroCopy } from "./dentalThemeCopy.ts";

test("dental hero copy prefers CMS fields over translation defaults", () => {
  const copy = resolveDentalHeroCopy(
    {
      headline: "CMS headline",
      accent: "CMS accent",
      body: "CMS body",
      cta_primary_label: "CMS action",
    },
    {
      headline: "Default headline",
      accent: "",
      body: "Default body",
      cta: "Default action",
    },
  );

  assert.deepEqual(copy, {
    kicker: "",
    headline: "CMS headline",
    accent: "CMS accent",
    body: "CMS body",
    cta: "CMS action",
  });
});

test("dental hero copy falls back when CMS fields are empty", () => {
  const copy = resolveDentalHeroCopy(
    {
      headline: "",
      accent: "",
      body: "",
      cta_primary_label: "",
    },
    {
      headline: "Default headline",
      accent: "Default accent",
      body: "Default body",
      cta: "Default action",
    },
  );

  assert.equal(copy.headline, "Default headline");
  assert.equal(copy.body, "Default body");
  assert.equal(copy.cta, "Default action");
});

test("dental hero copy prefers Arabic CMS when locale is ar", () => {
  const copy = resolveDentalHeroCopy(
    {
      headline: "EN headline",
      headline_ar: "عنوان عربي",
      accent: "",
      body: "EN body",
      body_ar: "نص عربي",
      cta_primary_label: "Book",
      cta_primary_label_ar: "احجز",
    },
    {
      headline: "Default",
      accent: "",
      body: "Default",
      cta: "Default",
    },
    "ar",
  );

  assert.equal(copy.headline, "عنوان عربي");
  assert.equal(copy.body, "نص عربي");
  assert.equal(copy.cta, "احجز");
});
