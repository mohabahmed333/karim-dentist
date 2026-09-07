import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { cdtAddPayload } from "./cdtAdd.ts";

describe("cdtAddPayload", () => {
  it("uses the doctor fee and catalog title, not a catalog price", () => {
    const payload = cdtAddPayload("16", "D3330", 7200);
    assert.equal(payload?.cdt_code, "D3330");
    assert.equal(payload?.fee_amount, 7200);
    assert.equal(payload?.phase, "urgent");
    assert.match(payload?.last_treatment ?? "", /molar/i);
  });

  it("returns null for an unknown code", () => {
    assert.equal(cdtAddPayload("16", "D0000", 100), null);
  });
});
