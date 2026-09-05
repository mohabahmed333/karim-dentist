import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { openBalanceEgp } from "./queueHelpers.pure.ts";

describe("openBalanceEgp", () => {
  it("sums open and scheduled fees only", () => {
    const total = openBalanceEgp([
      {
        id: "1",
        toothFdi: "38",
        toothLabel: "x",
        cdtCode: "D7140",
        description: "Extract",
        severity: "Critical",
        status: "open",
        feeAmount: 250,
        imageUrls: [],
        source: "session",
      },
      {
        id: "2",
        toothFdi: "25",
        toothLabel: "y",
        cdtCode: "D2740",
        description: "Crown",
        severity: "Minor",
        status: "done",
        feeAmount: 1200,
        imageUrls: [],
        source: "server",
      },
    ]);
    assert.equal(total, 250);
  });
});
