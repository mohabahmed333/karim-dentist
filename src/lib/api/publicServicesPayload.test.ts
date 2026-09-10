import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { buildPublicServicesPayload } from "./publicServicesPayload.ts";

const SERVICES = [
  {
    id: "s2",
    title: "Gingivectomy",
    title_ar: "",
    description: "Removes excess gum tissue.",
    description_ar: "",
    kind: "laser",
    sort_order: 2,
    slug: "gingivectomy",
  },
  {
    id: "s1",
    title: "Teeth whitening",
    title_ar: "تبييض الأسنان",
    description: "Brighten your smile.",
    description_ar: "إشراق ابتسامتك.",
    kind: "our_services",
    sort_order: 1,
    slug: "teeth-whitening",
  },
  {
    id: "s3",
    title: "Untitled",
    title_ar: "",
    description: "",
    description_ar: "",
    kind: "our_services",
    sort_order: 3,
    slug: null,
  },
];

test("returns each real service, sorted by sort_order", () => {
  const payload = buildPublicServicesPayload(SERVICES, "https://thedentallounge.com");
  assert.deepEqual(
    payload.map((s) => s.id),
    ["s1", "s2"],
  );
});

test("excludes services with a placeholder title", () => {
  const payload = buildPublicServicesPayload(SERVICES, "https://thedentallounge.com");
  assert.ok(!payload.some((s) => s.id === "s3"));
});

test("carries bilingual name/description and the service kind", () => {
  const payload = buildPublicServicesPayload(SERVICES, "https://thedentallounge.com");
  const whitening = payload.find((s) => s.id === "s1");
  assert.deepEqual(whitening?.name, { en: "Teeth whitening", ar: "تبييض الأسنان" });
  assert.deepEqual(whitening?.description, {
    en: "Brighten your smile.",
    ar: "إشراق ابتسامتك.",
  });
  assert.equal(whitening?.kind, "our_services");
});

test("includes the detail page url only when a slug exists", () => {
  const payload = buildPublicServicesPayload(SERVICES, "https://thedentallounge.com");
  const whitening = payload.find((s) => s.id === "s1");
  assert.equal(whitening?.url, "https://thedentallounge.com/services/teeth-whitening");

  const noSlug = { ...SERVICES[0], slug: null };
  const withoutSlug = buildPublicServicesPayload(
    [noSlug],
    "https://thedentallounge.com",
  );
  assert.equal(withoutSlug[0]?.url, null);
});
