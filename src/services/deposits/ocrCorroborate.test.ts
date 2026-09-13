import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { corroborate } from "./ocrCorroborate.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { receiptExtractionSchema } from "./receiptSchema.ts";

const extraction = (over: Record<string, unknown> = {}) =>
  receiptExtractionSchema.parse({
    isReceipt: true,
    amount: 200,
    reference: "FT24091300123",
    confidence: 0.95,
    ...over,
  });

/** Verbatim Tesseract output for a clean English InstaPay receipt. */
const ENGLISH_OCR = `InstaPay
Transfer successful
Amount
200.00 EGP
To
THE DENTAL LOUNGE
Account
dentallounge@instapay
From
AHMED ALI HASSAN
Reference
FT24091300123
Date
13 Sep 2026, 11:45 AM`;

/**
 * Verbatim Tesseract output for an Arabic receipt with Western digits. The
 * prose is gibberish and the numbers are exact — which is the whole reason this
 * check only ever looks at digits.
 */
const ARABIC_OCR = `Bosley Jl
Jpwdé
200.00 ¢.p
Js
01001234567
28p IJgpdss
VF987654321
Jehse
13/09/2026 11:45`;

/** And with Arabic-Indic digits, where even the numbers come back wrong. */
const ARABIC_INDIC_OCR = `Bosley Jl
Jeodé
Yeo,e0 Top
Js
Se YYrE0TV
8p lJepdse
VFaAv10£¥T)`;

describe("corroborate — when it has no opinion", () => {
  it("abstains when OCR did not run", () => {
    assert.deepEqual(corroborate(null, extraction()), {
      checked: false,
      reason: "unavailable",
    });
  });

  it("abstains on a reading with almost no digits in it", () => {
    assert.deepEqual(corroborate("some blurry words", extraction()), {
      checked: false,
      reason: "unreadable",
    });
  });

  it("abstains on an Arabic-Indic receipt rather than crying wolf", () => {
    // Tesseract cannot read ٢٠٠ with English training data. Reporting a
    // mismatch here would flag every such receipt and teach staff to ignore it.
    const result = corroborate(ARABIC_INDIC_OCR, extraction());
    assert.equal(result.checked, false);
  });
});

describe("corroborate — when it agrees", () => {
  it("finds the amount and reference on a clean English receipt", () => {
    assert.deepEqual(corroborate(ENGLISH_OCR, extraction()), {
      checked: true,
      missing: [],
    });
  });

  it("finds them on an Arabic receipt whose prose it mangled", () => {
    // The digits are exact even at 49% overall confidence.
    const result = corroborate(
      ARABIC_OCR,
      extraction({ amount: 200, reference: "VF987654321" }),
    );
    assert.deepEqual(result, { checked: true, missing: [] });
  });

  it("matches a whole amount printed with decimals", () => {
    const result = corroborate(
      "Total 200.00 EGP ref FT24091300123",
      extraction(),
    );
    assert.deepEqual(result.missing, []);
  });

  it("matches an amount printed with thousands separators", () => {
    const result = corroborate(
      "Amount 1,500.00 EGP\nRef FT24091300123",
      extraction({ amount: 1500 }),
    );
    assert.deepEqual(result.missing, []);
  });

  it("matches a reference whatever the case and punctuation", () => {
    const result = corroborate(
      "amount 200.00 reference: ft-2409/1300123",
      extraction({ reference: "FT24091300123" }),
    );
    assert.deepEqual(result.missing, []);
  });
});

describe("corroborate — when it disagrees", () => {
  it("reports an amount that is nowhere on the receipt", () => {
    // The failure this whole module exists for: a model that invented a number.
    const result = corroborate(ENGLISH_OCR, extraction({ amount: 950 }));
    assert.deepEqual(result, { checked: true, missing: ["amount"] });
  });

  it("reports a reference that is nowhere on the receipt", () => {
    const result = corroborate(ENGLISH_OCR, extraction({ reference: "ZZ99999999" }));
    assert.deepEqual(result, { checked: true, missing: ["reference"] });
  });

  it("reports both when both are invented", () => {
    const result = corroborate(
      ENGLISH_OCR,
      extraction({ amount: 950, reference: "ZZ99999999" }),
    );
    assert.deepEqual(result.missing, ["amount", "reference"]);
  });

  it("says nothing about fields the model left null", () => {
    const result = corroborate(ENGLISH_OCR, extraction({ amount: null, reference: null }));
    assert.deepEqual(result, { checked: true, missing: [] });
  });

  it("ignores a reference too short to mean anything", () => {
    // "12" would match half of any receipt; claiming either way is noise.
    const result = corroborate(ENGLISH_OCR, extraction({ reference: "12" }));
    assert.deepEqual(result.missing, []);
  });

  it("never comments on names, which OCR mangles on any Arabic receipt", () => {
    const result = corroborate(
      ARABIC_OCR,
      extraction({ amount: 200, reference: "VF987654321", recipientName: "عيادة الأسنان" }),
    );
    assert.deepEqual(result.missing, []);
  });
});
