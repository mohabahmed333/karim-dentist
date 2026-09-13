import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { normalizeArabic } from "./normalizeArabic.ts";

describe("normalizeArabic", () => {
  /** The exact complaint: "اسنان" (no hamza) must read the same as "أسنان". */
  it("folds a dropped hamza on alef", () => {
    assert.equal(normalizeArabic("اسنان"), normalizeArabic("أسنان"));
    assert.equal(normalizeArabic("اسنان"), "اسنان");
  });

  it("folds every alef-with-hamza variant to a bare alef", () => {
    for (const word of ["أهلا", "إهلا", "آهلا", "ٱهلا", "اهلا"]) {
      assert.equal(normalizeArabic(word), "اهلا");
    }
  });

  it("folds alef maqsura to ya", () => {
    assert.equal(normalizeArabic("على"), normalizeArabic("علي"));
  });

  it("folds ta marbuta to ha, in both typing directions", () => {
    assert.equal(normalizeArabic("خدمة"), normalizeArabic("خدمه"));
    assert.equal(normalizeArabic("العيادة"), normalizeArabic("العياده"));
  });

  it("strips diacritics without touching the letters under them", () => {
    assert.equal(normalizeArabic("مُحَمَّد"), "محمد");
  });

  it("strips tatweel", () => {
    assert.equal(normalizeArabic("احجزـلي"), normalizeArabic("احجزلي"));
  });

  it("leaves English and digits untouched", () => {
    assert.equal(normalizeArabic("book 10:30 اسنان"), "book 10:30 اسنان");
  });

  it("leaves already-normalized text unchanged", () => {
    const text = "عايز احجز ميعاد بكره";
    assert.equal(normalizeArabic(text), text);
  });

  it("handles empty input", () => {
    assert.equal(normalizeArabic(""), "");
  });
});

describe("normalizeArabic — waw-hamza and yeh-hamza", () => {
  /** The actual gap: the false-confirmation guard missed "تم التاكيد". */
  it("folds hamza on waw, so مؤكد reads the same as موكد", () => {
    assert.equal(normalizeArabic("مؤكد"), normalizeArabic("موكد"));
    assert.equal(normalizeArabic("مؤكد"), "موكد");
  });

  it("folds hamza on yeh to a bare yeh", () => {
    assert.equal(normalizeArabic("مسئول"), normalizeArabic("مسيول"));
  });

  it("leaves the alef-hamza fold working alongside the new ones", () => {
    assert.equal(normalizeArabic("تم التأكيد"), normalizeArabic("تم التاكيد"));
  });
});
