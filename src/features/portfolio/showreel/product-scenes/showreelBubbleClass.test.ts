import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { showreelBubbleClass } from "./showreelBubbleClass.ts";

const USER_SKIN = "bg-[var(--admin-primary)] text-white";

describe("showreelBubbleClass", () => {
  it("lets a user bubble's background beat the shared bubble's white fill", () => {
    const cls = showreelBubbleClass(true, USER_SKIN);
    assert.ok(cls.includes("bg-[var(--admin-primary)]"));
    assert.ok(!cls.includes("bg-white"));
  });

  it("lets a user bubble's text colour beat the shared bubble's ink", () => {
    const cls = showreelBubbleClass(true, USER_SKIN);
    assert.ok(cls.includes("text-white"));
    assert.ok(!cls.includes("text-[#111111]"));
  });

  it("keeps the shared font size, which is not a colour conflict", () => {
    assert.ok(showreelBubbleClass(true, USER_SKIN).includes("text-[13px]"));
  });

  it("indents user bubbles only", () => {
    assert.ok(showreelBubbleClass(true).includes("ms-8"));
    assert.ok(!showreelBubbleClass(false).includes("ms-8"));
  });

  it("keeps the shared skin when nothing overrides it", () => {
    const cls = showreelBubbleClass(false);
    assert.ok(cls.includes("bg-white"));
    assert.ok(cls.includes("text-[#111111]"));
  });
});
