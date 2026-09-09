import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { pollForTarget } from "./pollForTarget.ts";

/** Deterministic stand-in for setTimeout + Date.now. */
function fakeClock() {
  let time = 0;
  const queue: { at: number; id: number; fn: () => void }[] = [];
  let nextId = 1;

  return {
    now: () => time,
    schedule: (fn: () => void, ms: number) => {
      const id = nextId++;
      queue.push({ at: time + ms, id, fn });
      return id;
    },
    cancel: (handle: unknown) => {
      const i = queue.findIndex((entry) => entry.id === handle);
      if (i >= 0) queue.splice(i, 1);
    },
    advance: (ms: number) => {
      const until = time + ms;
      for (;;) {
        queue.sort((a, b) => a.at - b.at);
        const next = queue[0];
        if (!next || next.at > until) break;
        queue.shift();
        time = next.at;
        next.fn();
      }
      time = until;
    },
    pending: () => queue.length,
  };
}

describe("pollForTarget", () => {
  it("settles synchronously when the target is already there", () => {
    const clock = fakeClock();
    const seen: (string | null)[] = [];

    pollForTarget(() => "ready", (value) => seen.push(value), {
      now: clock.now,
      schedule: clock.schedule,
      cancel: clock.cancel,
    });

    assert.deepEqual(seen, ["ready"]);
    assert.equal(clock.pending(), 0);
  });

  it("keeps retrying until the target mounts", () => {
    const clock = fakeClock();
    const seen: (string | null)[] = [];
    let attempts = 0;

    pollForTarget(
      () => {
        attempts += 1;
        return attempts >= 3 ? "late" : null;
      },
      (value) => seen.push(value),
      {
        intervalMs: 60,
        now: clock.now,
        schedule: clock.schedule,
        cancel: clock.cancel,
      },
    );

    assert.deepEqual(seen, []);
    clock.advance(60);
    assert.deepEqual(seen, []);
    clock.advance(60);
    assert.deepEqual(seen, ["late"]);
    assert.equal(attempts, 3);
  });

  it("settles with null once the budget runs out", () => {
    const clock = fakeClock();
    const seen: (string | null)[] = [];

    pollForTarget(() => null, (value) => seen.push(value), {
      timeoutMs: 120,
      intervalMs: 60,
      now: clock.now,
      schedule: clock.schedule,
      cancel: clock.cancel,
    });

    clock.advance(60);
    assert.deepEqual(seen, []);
    clock.advance(60);
    assert.deepEqual(seen, [null]);
    assert.equal(clock.pending(), 0);
  });

  it("stops retrying after cancel", () => {
    const clock = fakeClock();
    const seen: (string | null)[] = [];

    const cancel = pollForTarget(() => null, (value) => seen.push(value), {
      timeoutMs: 1000,
      intervalMs: 60,
      now: clock.now,
      schedule: clock.schedule,
      cancel: clock.cancel,
    });

    cancel();
    clock.advance(1000);
    assert.deepEqual(seen, []);
    assert.equal(clock.pending(), 0);
  });

  it("settles at most once even if a later probe would also match", () => {
    const clock = fakeClock();
    const seen: (string | null)[] = [];
    let probes = 0;

    const cancel = pollForTarget(
      () => {
        probes += 1;
        return "now";
      },
      (value) => seen.push(value),
      {
        timeoutMs: 1000,
        intervalMs: 60,
        now: clock.now,
        schedule: clock.schedule,
        cancel: clock.cancel,
      },
    );

    // Settled on the first probe; neither the clock nor a late cancel may
    // produce a second callback.
    clock.advance(500);
    cancel();
    clock.advance(500);

    assert.deepEqual(seen, ["now"]);
    assert.equal(probes, 1);
  });

  it("treats a falsy-but-present value as found", () => {
    const clock = fakeClock();
    const seen: (number | null)[] = [];

    pollForTarget(() => 0, (value) => seen.push(value), {
      now: clock.now,
      schedule: clock.schedule,
      cancel: clock.cancel,
    });

    assert.deepEqual(seen, [0]);
    assert.equal(clock.pending(), 0);
  });

  it("keeps polling while the resolver returns undefined", () => {
    const clock = fakeClock();
    const seen: (string | null)[] = [];
    let probes = 0;

    pollForTarget(
      () => {
        probes += 1;
        return probes >= 2 ? "found" : undefined;
      },
      (value) => seen.push(value),
      {
        intervalMs: 60,
        now: clock.now,
        schedule: clock.schedule,
        cancel: clock.cancel,
      },
    );

    assert.deepEqual(seen, []);
    clock.advance(60);
    assert.deepEqual(seen, ["found"]);
  });
});
