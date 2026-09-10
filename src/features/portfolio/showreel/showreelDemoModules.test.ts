import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

function staticImportSpecifiers(file: string) {
  const source = readFileSync(join(here, file), "utf8");
  // Static `import ... from "x"` / `import "x"` only — `await import("x")`
  // inside next/dynamic is a separate chunk and is exactly what we want.
  const specs: string[] = [];
  // `import type` is erased at compile time and costs nothing at runtime.
  const re = /^\s*import\s(?!type\s)(?:[\s\S]*?\sfrom\s)?["']([^"']+)["'];?\s*$/gm;
  let match: RegExpExecArray | null;
  while ((match = re.exec(source)) !== null) specs.push(match[1]);
  return specs;
}

// Every /showreel/demo iframe used to download all 46 chunks (~18MB dev JS)
// because these two files statically imported every branch. Eight feature
// slides mount at once, so each unused import is paid eight times over.
test("the demo client does not statically pull the branches it will not render", () => {
  const specs = staticImportSpecifiers("ShowreelDemoClient.tsx");
  const heavy = specs.filter((s) =>
    /customize|ShowreelSiteEmbed|ShowreelProductDemo/i.test(s),
  );
  assert.deepEqual(
    heavy,
    [],
    `expected lazy branches, found static imports: ${heavy.join(", ")}`,
  );
});

test("the product demo does not statically pull all six scenes", () => {
  const specs = staticImportSpecifiers("product-scenes/ShowreelProductDemo.tsx");
  const scenes = specs.filter((s) => /Scene$/.test(s));
  assert.deepEqual(
    scenes,
    [],
    `expected lazy scenes, found static imports: ${scenes.join(", ")}`,
  );
});

// The site-to-chat panel reads only settings + services, but the route ran
// the full 18-query getPortfolioData() under force-dynamic on every load.
test("the product branch of the demo route uses the narrow booking fetch", () => {
  const source = readFileSync(
    join(here, "../../../app/(internal)/showreel/demo/page.tsx"),
    "utf8",
  );
  const productBranch = source.slice(source.indexOf('if (mode === "product")'));
  const end = productBranch.indexOf("const [customizeData");
  const body = end === -1 ? productBranch : productBranch.slice(0, end);

  assert.ok(
    body.includes("getShowreelBookingData()"),
    "expected the product branch to use getShowreelBookingData()",
  );
  assert.ok(
    !body.includes("getPortfolioData()"),
    "expected the product branch not to run the full portfolio fetch",
  );
});
