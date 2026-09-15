import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { cdtAddPayload, serviceAddPayload } from "./cdtAdd.ts";

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

describe("serviceAddPayload", () => {
  it("prices from the service's minimum, with no CDT code", () => {
    const payload = serviceAddPayload("16", {
      id: "svc-1",
      title: "Root Canal Therapy",
      price_min_egp: 2500,
      price_max_egp: 4000,
    } as never);
    assert.equal(payload.cdt_code, null);
    assert.equal(payload.fee_amount, 2500);
    assert.equal(payload.phase, "restorative");
    assert.equal(payload.last_treatment, "Root Canal Therapy");
  });

  it("falls back to 0 when the service has no price on file", () => {
    const payload = serviceAddPayload("16", {
      id: "svc-2",
      title: "Consultation",
      price_min_egp: null,
      price_max_egp: null,
    } as never);
    assert.equal(payload.fee_amount, 0);
  });
});
