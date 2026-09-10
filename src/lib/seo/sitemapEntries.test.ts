import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { buildSitemapEntries } from "./sitemapEntries.ts";

const NOW = new Date("2026-09-10T00:00:00.000Z");

test("always includes the homepage as the highest-priority entry", () => {
  const entries = buildSitemapEntries({
    siteUrl: "https://thedentallounge.com",
    hiddenSections: [],
    caseStudies: [],
    featuredProjects: [],
  });
  assert.equal(entries[0]?.url, "https://thedentallounge.com/");
  assert.equal(entries[0]?.priority, 1);
});

test("lists the case studies index and every published slug when visible", () => {
  const entries = buildSitemapEntries({
    siteUrl: "https://thedentallounge.com",
    hiddenSections: [],
    caseStudies: [
      { slug: "a", is_published: true, deleted_at: null, updated_at: NOW.toISOString() },
      { slug: "b", is_published: true, deleted_at: null, updated_at: NOW.toISOString() },
    ],
    featuredProjects: [],
  });
  const urls = entries.map((e) => e.url);
  assert.ok(urls.includes("https://thedentallounge.com/case-studies"));
  assert.ok(urls.includes("https://thedentallounge.com/case-studies/a"));
  assert.ok(urls.includes("https://thedentallounge.com/case-studies/b"));
});

test("omits case studies entirely when the section is hidden — matches the redirect", () => {
  const entries = buildSitemapEntries({
    siteUrl: "https://thedentallounge.com",
    hiddenSections: ["case-studies"],
    caseStudies: [
      { slug: "a", is_published: true, deleted_at: null, updated_at: NOW.toISOString() },
    ],
    featuredProjects: [],
  });
  const urls = entries.map((e) => e.url);
  assert.ok(!urls.some((u) => u.includes("case-studies")));
});

test("skips unpublished, soft-deleted, and slugless case studies", () => {
  const entries = buildSitemapEntries({
    siteUrl: "https://thedentallounge.com",
    hiddenSections: [],
    caseStudies: [
      { slug: "draft", is_published: false, deleted_at: null, updated_at: NOW.toISOString() },
      { slug: "gone", is_published: true, deleted_at: NOW.toISOString(), updated_at: NOW.toISOString() },
      { slug: null, is_published: true, deleted_at: null, updated_at: NOW.toISOString() },
      { slug: "live", is_published: true, deleted_at: null, updated_at: NOW.toISOString() },
    ],
    featuredProjects: [],
  });
  const urls = entries.map((e) => e.url);
  assert.ok(!urls.some((u) => u.includes("draft")));
  assert.ok(!urls.some((u) => u.includes("gone")));
  assert.ok(urls.includes("https://thedentallounge.com/case-studies/live"));
});

test("featured projects follow the same visibility and publish gating", () => {
  const entries = buildSitemapEntries({
    siteUrl: "https://thedentallounge.com",
    hiddenSections: ["featured"],
    caseStudies: [],
    featuredProjects: [
      { slug: "p1", is_published: true, deleted_at: null, updated_at: NOW.toISOString() },
    ],
  });
  const urls = entries.map((e) => e.url);
  assert.ok(!urls.some((u) => u.includes("featured")));
});

test("never emits duplicate URLs", () => {
  const entries = buildSitemapEntries({
    siteUrl: "https://thedentallounge.com",
    hiddenSections: [],
    caseStudies: [
      { slug: "a", is_published: true, deleted_at: null, updated_at: NOW.toISOString() },
    ],
    featuredProjects: [],
  });
  const urls = entries.map((e) => e.url);
  assert.equal(new Set(urls).size, urls.length);
});
