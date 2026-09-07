import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error -- Node's strip-types runner requires the explicit extension.
import { getPortfolioImageSrc } from "./portfolioImage.ts";

test("proxies remote Supabase images through the Next image optimizer", () => {
  const source =
    "https://project.supabase.co/storage/v1/object/public/projects/large.png";

  assert.equal(
    getPortfolioImageSrc(source),
    `/_next/image?url=${encodeURIComponent(source)}&w=1200&q=75`,
  );
});

test("leaves local images unchanged", () => {
  assert.equal(getPortfolioImageSrc("/images/local.png"), "/images/local.png");
});

test("skips the optimizer in live preview so fresh uploads display", () => {
  const source =
    "https://project.supabase.co/storage/v1/object/public/projects/fresh.png";
  assert.equal(getPortfolioImageSrc(source, false), source);
});
