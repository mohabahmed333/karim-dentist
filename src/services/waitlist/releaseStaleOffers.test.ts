import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { OFFER_CLAIM_WINDOW, releaseStaleWaitlistOffers } from "./releaseStaleOffers.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { createFakeDb } from "@/services/admin_ai/testing/fakeDb.ts";

describe("releaseStaleWaitlistOffers", () => {
  it("asks the database to free offers older than the claim window", async () => {
    const db = createFakeDb({ rpc: { release_stale_waitlist_offers: { data: 3, error: null } } });
    assert.equal(await releaseStaleWaitlistOffers(db as never), 3);
    const call = db.rpcCalls()[0];
    assert.equal(call.fn, "release_stale_waitlist_offers");
    // The same window the assistant holds an offered slot for, so a patient
    // answering at minute 29 is still honoured.
    assert.equal(call.args.p_max_age, OFFER_CLAIM_WINDOW);
  });

  it("honours a caller-supplied window", async () => {
    const db = createFakeDb({ rpc: { release_stale_waitlist_offers: { data: 0, error: null } } });
    await releaseStaleWaitlistOffers(db as never, "2 hours");
    assert.equal(db.rpcCalls()[0].args.p_max_age, "2 hours");
  });

  it("reports nothing freed when the call fails, rather than throwing", async () => {
    // It rides the dispatcher tick; a failure here must not stop the outbox.
    const db = createFakeDb({
      rpc: { release_stale_waitlist_offers: { data: null, error: { message: "boom" } } },
    });
    assert.equal(await releaseStaleWaitlistOffers(db as never), 0);
  });

  it("copes with a database that returns something unexpected", async () => {
    const db = createFakeDb({ rpc: { release_stale_waitlist_offers: { data: null, error: null } } });
    assert.equal(await releaseStaleWaitlistOffers(db as never), 0);
  });
});
