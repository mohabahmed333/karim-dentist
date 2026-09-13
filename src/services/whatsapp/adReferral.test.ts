import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { extractAdReferral } from "./adReferral.ts";

/** The shape Meta documents on the first message after an ad click. */
const META_REFERRAL = {
  source_url: "https://fb.me/2abcXYZ",
  source_id: "1234567890",
  source_type: "ad",
  headline: "Teeth whitening, 20% off",
  body: "Book this week",
  media_url: "https://scontent.example/ad.jpg",
  ctwa_clid: "ARAaBbCcDd1234",
};

describe("extractAdReferral", () => {
  it("reads a referral sitting on the message, as Meta sends it", () => {
    const out = extractAdReferral({ type: "text", referral: META_REFERRAL });
    assert.deepEqual(out, {
      ctwaClid: "ARAaBbCcDd1234",
      sourceId: "1234567890",
      sourceType: "ad",
      sourceUrl: "https://fb.me/2abcXYZ",
      headline: "Teeth whitening, 20% off",
      body: "Book this week",
      mediaUrl: "https://scontent.example/ad.jpg",
    });
  });

  it("finds one tucked under the vendor envelope instead", () => {
    // Kapso does not model this field, so if it ever forwards it the nesting
    // is a guess. Looking in both places costs nothing.
    const out = extractAdReferral({ kapso: { referral: META_REFERRAL } });
    assert.equal(out?.ctwaClid, "ARAaBbCcDd1234");

    const nested = extractAdReferral({
      kapso: { message_type_data: { referral: META_REFERRAL } },
    });
    assert.equal(nested?.sourceId, "1234567890");
  });

  it("accepts camelCase, in case a vendor normalises the keys", () => {
    const out = extractAdReferral({ referral: { ctwaClid: "X1", sourceId: "9", sourceType: "post" } });
    assert.equal(out?.ctwaClid, "X1");
    assert.equal(out?.sourceType, "post");
  });

  it("is null for an ordinary message", () => {
    assert.equal(extractAdReferral({ type: "text", text: { body: "hi" } }), null);
    assert.equal(extractAdReferral({}), null);
    assert.equal(extractAdReferral(null), null);
    assert.equal(extractAdReferral("nonsense"), null);
  });

  it("is null for a referral with nothing to join on", () => {
    // A headline with no ad id cannot attribute a booking to anything; that is
    // noise, not attribution.
    assert.equal(extractAdReferral({ referral: { headline: "Whitening" } }), null);
    assert.equal(extractAdReferral({ referral: {} }), null);
  });

  it("treats blank strings as missing", () => {
    assert.equal(extractAdReferral({ referral: { ctwa_clid: "   ", source_id: "" } }), null);
    const out = extractAdReferral({ referral: { source_id: "7", headline: "  " } });
    assert.equal(out?.headline, null);
  });

  it("survives a referral whose fields are the wrong types", () => {
    const out = extractAdReferral({ referral: { source_id: 42, ctwa_clid: "OK", headline: [] } });
    assert.equal(out?.ctwaClid, "OK");
    assert.equal(out?.sourceId, null);
    assert.equal(out?.headline, null);
  });
});
