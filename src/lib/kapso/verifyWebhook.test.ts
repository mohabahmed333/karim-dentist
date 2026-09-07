import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { describe, it } from "node:test";
import { verifyKapsoWebhookSignature } from "./verifyWebhook";

describe("verifyKapsoWebhookSignature", () => {
  const secret = "test-secret";

  it("accepts a valid hmac signature", () => {
    const body = '{"ok":true}';
    const signature = createHmac("sha256", secret).update(body).digest("hex");
    assert.equal(verifyKapsoWebhookSignature(body, signature, secret), true);
  });

  it("rejects invalid signature", () => {
    assert.equal(verifyKapsoWebhookSignature("{}", "deadbeef", secret), false);
  });

  it("rejects missing signature", () => {
    assert.equal(verifyKapsoWebhookSignature("{}", null, secret), false);
  });
});
