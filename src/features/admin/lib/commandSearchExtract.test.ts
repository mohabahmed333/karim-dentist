import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  extractCommandSearchIds,
  mergeAiHitOrder,
} from "./commandSearchExtract.ts";
import { shouldUseAiSearch } from "./commandSearch.ts";
import type { CommandHit } from "./commandPalette.ts";

describe("extractCommandSearchIds", () => {
  it("reads ranked ids from a fenced JSON object", () => {
    const raw = `Sure.
\`\`\`json
{ "ids": ["section:hero", "public:home", "missing"] }
\`\`\``;
    assert.deepEqual(extractCommandSearchIds(raw), [
      "section:hero",
      "public:home",
      "missing",
    ]);
  });

  it("reads a bare JSON object", () => {
    assert.deepEqual(extractCommandSearchIds('{"ids":["page:/admin"]}'), [
      "page:/admin",
    ]);
  });

  it("returns empty when the model did not return ids", () => {
    assert.deepEqual(extractCommandSearchIds("no catalog match"), []);
  });
});

describe("mergeAiHitOrder", () => {
  const hits: CommandHit[] = [
    {
      id: "a",
      kind: "page",
      title: "A",
      href: "/a",
      keywords: "",
    },
    {
      id: "b",
      kind: "page",
      title: "B",
      href: "/b",
      keywords: "",
    },
    {
      id: "c",
      kind: "public",
      title: "C",
      href: "/",
      keywords: "",
    },
  ];

  it("lifts AI ids to the front and keeps remaining local hits", () => {
    const merged = mergeAiHitOrder(hits, [hits[0]!, hits[1]!], ["c", "a"]);
    assert.deepEqual(
      merged.map((item) => item.id),
      ["c", "a", "b"],
    );
  });
});

describe("shouldUseAiSearch", () => {
  it("skips short queries", () => {
    assert.equal(shouldUseAiSearch("mo", 0, 0), false);
  });

  it("runs for natural-language sentences", () => {
    assert.equal(shouldUseAiSearch("change the homepage banner", 20, 4), true);
  });

  it("runs when local search found nothing useful", () => {
    assert.equal(shouldUseAiSearch("whitening", 0, 0), true);
  });
});
