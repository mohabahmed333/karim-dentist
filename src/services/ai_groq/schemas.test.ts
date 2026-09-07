import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { treatmentAiResponseSchema } from "./schemas.ts";

describe("treatmentAiResponseSchema poll sanitize", () => {
  it("drops empty option values and keeps valid options", () => {
    const parsed = treatmentAiResponseSchema.parse({
      reply: "مرحبا — how can I help with this tooth?",
      poll: {
        id: "poll-1",
        kind: "generic",
        question: "What next?",
        options: [
          { id: "a", label: "Chart findings", value: "chart" },
          { id: "b", label: "Pick CDT", value: "cdt" },
          { id: "c", label: "", value: "" },
        ],
      },
    });
    assert.equal(parsed.poll?.options.length, 2);
    assert.equal(parsed.poll?.options[0]?.value, "chart");
  });

  it("fills missing value from label", () => {
    const parsed = treatmentAiResponseSchema.parse({
      reply: "Choose a procedure",
      poll: {
        id: "p",
        kind: "cdt",
        question: "CDT?",
        options: [{ id: "1", label: "D2391", value: "  " }],
      },
    });
    assert.equal(parsed.poll?.options[0]?.value, "D2391");
  });

  it("nulls poll when all options are empty", () => {
    const parsed = treatmentAiResponseSchema.parse({
      reply: "Hello",
      poll: {
        id: "p",
        kind: "generic",
        question: "?",
        options: [
          { id: "a", label: "", value: "" },
          { id: "b", label: " ", value: " " },
        ],
      },
    });
    assert.equal(parsed.poll, null);
  });
});
