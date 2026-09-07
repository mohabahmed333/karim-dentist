import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import {
  careBucketFor,
  careBucketFromDiagnosis,
  oppositeCareBucket,
  phaseAfterToggle,
  phaseForCareBucket,
} from "./careBucket.ts";

describe("care bucket rules", () => {
  it("routes endo and extractions to Immediate Care", () => {
    assert.equal(careBucketFor({ cdtCode: "D3330" }), "immediate");
    assert.equal(careBucketFor({ cdtCode: "D7140" }), "immediate");
    assert.equal(phaseForCareBucket("immediate"), "urgent");
  });

  it("routes fillings, crowns, and implants to Planned Care", () => {
    assert.equal(careBucketFor({ cdtCode: "D2391" }), "planned");
    assert.equal(careBucketFor({ cdtCode: "D2740" }), "planned");
    assert.equal(careBucketFor({ cdtCode: "D6010" }), "planned");
    assert.equal(phaseForCareBucket("planned"), "restorative");
  });

  it("lets diagnosis labels override the CDT family", () => {
    assert.equal(careBucketFromDiagnosis("Pain"), "immediate");
    assert.equal(careBucketFromDiagnosis("Infection"), "immediate");
    assert.equal(careBucketFromDiagnosis("Deep Decay"), "immediate");
    assert.equal(careBucketFromDiagnosis("Restorative"), "planned");
    assert.equal(careBucketFromDiagnosis("Prosthodontics"), "planned");
    assert.equal(
      careBucketFor({ cdtCode: "D2391", diagnosis: "Pain" }),
      "immediate",
    );
  });

  it("flips Immediate and Planned in one toggle", () => {
    assert.equal(oppositeCareBucket("immediate"), "planned");
    assert.equal(phaseAfterToggle("immediate"), "restorative");
    assert.equal(phaseAfterToggle("planned"), "urgent");
  });
});
