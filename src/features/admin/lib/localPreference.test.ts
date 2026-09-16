import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createLocalPreference } from "./localPreference.ts";

function fakeStorage(seed: Record<string, string> = {}) {
  const map = new Map(Object.entries(seed));
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
  };
}

describe("createLocalPreference", () => {
  it("reads the stored value and writes it back", () => {
    const storage = fakeStorage({ "my-day:doctor": "doc-1" });
    const pref = createLocalPreference("my-day:doctor", () => storage);
    assert.equal(pref.get(), "doc-1");
    pref.set("doc-2");
    assert.equal(pref.get(), "doc-2");
    assert.equal(storage.getItem("my-day:doctor"), "doc-2");
  });

  it("returns null for an unset key", () => {
    const pref = createLocalPreference("missing", () => fakeStorage());
    assert.equal(pref.get(), null);
  });

  it("returns null when storage is unavailable", () => {
    const pref = createLocalPreference("k", () => null);
    assert.equal(pref.get(), null);
    pref.set("x");
    assert.equal(pref.get(), "x");
  });

  it("survives storage that throws", () => {
    const pref = createLocalPreference("k", () => ({
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    }));
    assert.equal(pref.get(), null);
    assert.doesNotThrow(() => pref.set("x"));
  });

  it("notifies subscribers on write, and stops after unsubscribe", () => {
    const pref = createLocalPreference("k", () => fakeStorage());
    let calls = 0;
    const unsubscribe = pref.subscribe(() => {
      calls += 1;
    });
    pref.set("a");
    assert.equal(calls, 1);
    unsubscribe();
    pref.set("b");
    assert.equal(calls, 1);
  });

  it("clears to null", () => {
    const pref = createLocalPreference("k", () => fakeStorage({ k: "v" }));
    pref.set(null);
    assert.equal(pref.get(), null);
  });
});
