import assert from "node:assert/strict";
import test, { afterEach } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import robots from "./robots.ts";

const ORIGINAL = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL };
});

function asProduction() {
  process.env.VERCEL_ENV = "production";
  process.env.NEXT_PUBLIC_SITE_URL = "https://thedentallounge.com";
}

test("blocks everything on preview and local builds", () => {
  delete process.env.VERCEL_ENV;
  const result = robots();
  assert.deepEqual(result.rules, { userAgent: "*", disallow: "/" });
  // A preview must not advertise a sitemap pointing at production content.
  assert.equal(result.sitemap, undefined);
});

test("blocks everything on a non-production Vercel deploy", () => {
  process.env.VERCEL_ENV = "preview";
  assert.deepEqual(robots().rules, { userAgent: "*", disallow: "/" });
});

test("production points crawlers at the absolute sitemap URL", () => {
  asProduction();
  assert.equal(
    robots().sitemap,
    "https://thedentallounge.com/sitemap.xml",
  );
});

test("production keeps admin, api and showreel out of the index", () => {
  asProduction();
  const rules = robots().rules as { userAgent: string; disallow?: string[] }[];
  const wildcard = rules.find((rule) => rule.userAgent === "*");
  assert.ok(wildcard);
  for (const path of ["/admin", "/api/", "/showreel", "/showreel2", "/en/"]) {
    assert.ok(
      wildcard.disallow?.includes(path),
      `expected ${path} to be disallowed`,
    );
  }
});

test("production re-allows the public API despite the /api/ block", () => {
  asProduction();
  const rules = robots().rules as { userAgent: string; allow?: string[] }[];
  const wildcard = rules.find((rule) => rule.userAgent === "*");
  assert.ok(wildcard?.allow?.includes("/api/v1/public/"));
  assert.ok(wildcard?.allow?.includes("/api/v1/booking/slots"));
});

test("production welcomes the major AI assistants by name", () => {
  asProduction();
  const rules = robots().rules as { userAgent: string }[];
  const agents = new Set(rules.map((rule) => rule.userAgent));
  for (const agent of [
    "GPTBot",
    "OAI-SearchBot",
    "ClaudeBot",
    "Claude-User",
    "PerplexityBot",
    "Google-Extended",
  ]) {
    assert.ok(agents.has(agent), `expected ${agent} to be listed`);
  }
});

test("throttles the heavy crawlers instead of blocking them", () => {
  asProduction();
  const rules = robots().rules as {
    userAgent: string;
    crawlDelay?: number;
    allow?: string[];
  }[];
  const bytespider = rules.find((rule) => rule.userAgent === "Bytespider");
  assert.equal(bytespider?.crawlDelay, 1);
  assert.ok(bytespider?.allow?.includes("/"));
});
