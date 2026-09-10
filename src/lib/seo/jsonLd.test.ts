import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import {
  buildArticleNode,
  buildBreadcrumbList,
  buildClinicGraph,
  buildFaqPageNode,
  wrapGraph,
} from "./jsonLd.ts";

const SETTINGS = {
  brand_name: "The Dental Lounge",
  brand_logo_url: "/dental/logo.jpg",
  contact_clinic_name: "The Dental Lounge",
  contact_clinic_name_ar: "ذا دنتال لاونج",
  contact_doctor_name: "Dr. Karim Elshibiny",
  contact_doctor_name_ar: "د. كريم الشبيني",
  contact_credentials: "BDS, Laser Dentistry",
  contact_credentials_ar: "بكالوريوس طب الأسنان",
  contact_email: "hello@thedentallounge.com",
  contact_phone: "+20 111 192 2252",
  contact_whatsapp: "201111922252",
  contact_address: "A 41 Ozone Medical Center, New Cairo, Al Narges Buildings",
  contact_city: "New Cairo",
  contact_country: "Egypt",
  contact_map_url: "https://maps.google.com/?q=clinic",
  contact_latitude: 30.02,
  contact_longitude: 31.49,
  contact_price_range: "$$",
  contact_instagram: "https://instagram.com/thedentallounge",
  contact_facebook: "",
  contact_linkedin: "",
  contact_x: "",
  contact_behance: "",
};

const HOURS = {
  open_weekdays: [0, 1, 2, 3, 4],
  time_windows: ["10:00-18:00"],
  timezone: "Africa/Cairo",
};

const SERVICES = [
  {
    id: "s1",
    title: "Teeth whitening",
    title_ar: "تبييض الأسنان",
    description: "Brighten your smile.",
    description_ar: "",
    kind: "our_services",
    sort_order: 1,
    slug: "teeth-whitening",
  },
  {
    id: "s2",
    title: "Gingivectomy",
    title_ar: "",
    description: "",
    description_ar: "",
    kind: "laser",
    sort_order: 1,
    slug: null,
  },
  {
    id: "s3",
    title: "Untitled",
    title_ar: "",
    description: "",
    description_ar: "",
    kind: "our_services",
    sort_order: 2,
  },
];

test("clinic node carries NAP, socials, and stable @id", () => {
  const graph = buildClinicGraph({
    locale: "en",
    siteUrl: "https://thedentallounge.com",
    settings: SETTINGS,
    hours: HOURS,
    services: SERVICES,
  });
  const clinic = graph["@graph"].find((n: { "@id"?: string }) => n["@id"] === "https://thedentallounge.com/#clinic");
  assert.ok(clinic);
  assert.deepEqual(clinic["@type"], ["Dentist", "MedicalBusiness", "LocalBusiness"]);
  assert.equal(clinic.name, "The Dental Lounge");
  assert.equal(clinic.telephone, "+20 111 192 2252");
  assert.equal(clinic.priceRange, "$$");
  assert.equal(clinic.address.addressCountry, "EG");
  assert.equal(clinic.address.addressLocality, "New Cairo");
  assert.ok(clinic.sameAs.includes("https://instagram.com/thedentallounge"));
  assert.ok(clinic.sameAs.includes("https://wa.me/201111922252"));
});

test("emits geo only when both coordinates are present", () => {
  const withGeo = buildClinicGraph({
    locale: "en",
    siteUrl: "https://thedentallounge.com",
    settings: SETTINGS,
    hours: HOURS,
    services: SERVICES,
  });
  const clinic = withGeo["@graph"].find((n: { "@id"?: string }) => n["@id"]?.endsWith("#clinic"));
  assert.deepEqual(clinic.geo, {
    "@type": "GeoCoordinates",
    latitude: 30.02,
    longitude: 31.49,
  });

  const withoutGeo = buildClinicGraph({
    locale: "en",
    siteUrl: "https://thedentallounge.com",
    settings: { ...SETTINGS, contact_latitude: null, contact_longitude: null },
    hours: HOURS,
    services: SERVICES,
  });
  const clinicNoGeo = withoutGeo["@graph"].find((n: { "@id"?: string }) => n["@id"]?.endsWith("#clinic"));
  assert.equal(clinicNoGeo.geo, undefined);
});

test("omits priceRange when unset rather than guessing", () => {
  const graph = buildClinicGraph({
    locale: "en",
    siteUrl: "https://thedentallounge.com",
    settings: { ...SETTINGS, contact_price_range: "" },
    hours: HOURS,
    services: SERVICES,
  });
  const clinic = graph["@graph"].find((n: { "@id"?: string }) => n["@id"]?.endsWith("#clinic"));
  assert.equal(clinic.priceRange, undefined);
});

test("includes openingHoursSpecification from clinic_hours", () => {
  const graph = buildClinicGraph({
    locale: "en",
    siteUrl: "https://thedentallounge.com",
    settings: SETTINGS,
    hours: HOURS,
    services: SERVICES,
  });
  const clinic = graph["@graph"].find((n: { "@id"?: string }) => n["@id"]?.endsWith("#clinic"));
  assert.equal(clinic.openingHoursSpecification.length, 1);
  assert.equal(clinic.openingHoursSpecification[0].opens, "10:00");
});

test("does not emit a separate Organization node", () => {
  const graph = buildClinicGraph({
    locale: "en",
    siteUrl: "https://thedentallounge.com",
    settings: SETTINGS,
    hours: HOURS,
    services: SERVICES,
  });
  // Dentist/MedicalBusiness/LocalBusiness inherits Organization; a second
  // standalone node with a different @id would split the entity.
  const standaloneOrg = graph["@graph"].find(
    (n: { "@type"?: unknown; "@id"?: string }) =>
      n["@type"] === "Organization" && !n["@id"]?.endsWith("#clinic"),
  );
  assert.equal(standaloneOrg, undefined);
});

test("emits a Person node for the doctor, localized", () => {
  const en = buildClinicGraph({
    locale: "en",
    siteUrl: "https://thedentallounge.com",
    settings: SETTINGS,
    hours: HOURS,
    services: SERVICES,
  });
  const doctorEn = en["@graph"].find((n: { "@id"?: string }) => n["@id"]?.endsWith("#dr-karim"));
  assert.equal(doctorEn["@type"], "Person");
  assert.equal(doctorEn.name, "Dr. Karim Elshibiny");

  const ar = buildClinicGraph({
    locale: "ar",
    siteUrl: "https://thedentallounge.com",
    settings: SETTINGS,
    hours: HOURS,
    services: SERVICES,
  });
  const doctorAr = ar["@graph"].find((n: { "@id"?: string }) => n["@id"]?.endsWith("#dr-karim"));
  assert.equal(doctorAr.name, "د. كريم الشبيني");
});

test("builds an OfferCatalog of MedicalProcedure entries, skipping placeholders", () => {
  const graph = buildClinicGraph({
    locale: "en",
    siteUrl: "https://thedentallounge.com",
    settings: SETTINGS,
    hours: HOURS,
    services: SERVICES,
  });
  const catalog = graph["@graph"].find((n: { "@id"?: string }) => n["@id"]?.endsWith("#services"));
  assert.equal(catalog["@type"], "OfferCatalog");
  const procedureIds = catalog.itemListElement.map(
    (entry: { itemOffered: { "@id": string } }) => entry.itemOffered["@id"],
  );
  // s1 and s2 have visible titles; s3 ("Untitled") is a CMS placeholder and
  // must not appear as a real procedure.
  assert.ok(procedureIds.some((id: string) => id.endsWith("s1")));
  assert.ok(procedureIds.some((id: string) => id.endsWith("s2")));
  assert.ok(!procedureIds.some((id: string) => id.endsWith("s3")));

  const procedure1 = graph["@graph"].find((n: { "@id"?: string }) => n["@id"]?.endsWith("#service-s1"));
  assert.equal(procedure1["@type"], "MedicalProcedure");
  assert.equal(procedure1.name, "Teeth whitening");
});

test("localizes service names into Arabic when the CMS field is filled", () => {
  const graph = buildClinicGraph({
    locale: "ar",
    siteUrl: "https://thedentallounge.com",
    settings: SETTINGS,
    hours: HOURS,
    services: SERVICES,
  });
  const procedure1 = graph["@graph"].find((n: { "@id"?: string }) => n["@id"]?.endsWith("#service-s1"));
  assert.equal(procedure1.name, "تبييض الأسنان");
});

test("falls back to English service copy when Arabic is not yet filled in", () => {
  const graph = buildClinicGraph({
    locale: "ar",
    siteUrl: "https://thedentallounge.com",
    settings: SETTINGS,
    hours: HOURS,
    services: SERVICES,
  });
  // s2 has no title_ar.
  const procedure2 = graph["@graph"].find((n: { "@id"?: string }) => n["@id"]?.endsWith("#service-s2"));
  assert.equal(procedure2.name, "Gingivectomy");
});

test("includes a WebSite node pointing at the clinic as publisher", () => {
  const graph = buildClinicGraph({
    locale: "en",
    siteUrl: "https://thedentallounge.com",
    settings: SETTINGS,
    hours: HOURS,
    services: SERVICES,
  });
  const site = graph["@graph"].find((n: { "@id"?: string }) => n["@id"]?.endsWith("#website"));
  assert.equal(site["@type"], "WebSite");
  assert.equal(site.publisher["@id"], "https://thedentallounge.com/#clinic");
  assert.equal(site.potentialAction, undefined);
});

test("does not include a SearchAction — no public search exists on the site", () => {
  const graph = buildClinicGraph({
    locale: "en",
    siteUrl: "https://thedentallounge.com",
    settings: SETTINGS,
    hours: HOURS,
    services: SERVICES,
  });
  const json = JSON.stringify(graph);
  assert.ok(!json.includes("SearchAction"));
});

// --- BreadcrumbList ---

test("buildBreadcrumbList emits an ordered ListItem trail with absolute URLs", () => {
  const trail = buildBreadcrumbList("https://thedentallounge.com", [
    { name: "Home", path: "/" },
    { name: "Case studies", path: "/case-studies" },
    { name: "Laser gum contouring", path: "/case-studies/laser-gum-contouring" },
  ]);
  assert.equal(trail["@type"], "BreadcrumbList");
  assert.equal(trail.itemListElement.length, 3);
  assert.deepEqual(trail.itemListElement[0], {
    "@type": "ListItem",
    position: 1,
    name: "Home",
    item: "https://thedentallounge.com",
  });
  assert.deepEqual(trail.itemListElement[2], {
    "@type": "ListItem",
    position: 3,
    name: "Laser gum contouring",
    item: "https://thedentallounge.com/case-studies/laser-gum-contouring",
  });
});

// --- Article ---

test("buildArticleNode maps a case study into an Article node", () => {
  const node = buildArticleNode({
    siteUrl: "https://thedentallounge.com",
    path: "/case-studies/laser-gum-contouring",
    headline: "Laser gum contouring",
    description: "A comfort-first laser gum reshaping case.",
    image: "https://thedentallounge.com/media/case.jpg",
    datePublished: "2026-01-01T00:00:00.000Z",
    dateModified: "2026-02-01T00:00:00.000Z",
    authorName: "Dr. Karim Elshibiny",
    clinicId: "https://thedentallounge.com/#clinic",
  });
  assert.equal(node["@type"], "Article");
  assert.equal(node["@id"], "https://thedentallounge.com/case-studies/laser-gum-contouring#article");
  assert.equal(node.headline, "Laser gum contouring");
  assert.equal(node.image, "https://thedentallounge.com/media/case.jpg");
  assert.equal(node.datePublished, "2026-01-01T00:00:00.000Z");
  assert.equal(node.dateModified, "2026-02-01T00:00:00.000Z");
  assert.deepEqual(node.publisher, { "@id": "https://thedentallounge.com/#clinic" });
  assert.deepEqual(node.author, { "@type": "Person", name: "Dr. Karim Elshibiny" });
  assert.equal(node.mainEntityOfPage, "https://thedentallounge.com/case-studies/laser-gum-contouring");
});

test("buildArticleNode omits image when none is available, rather than a broken URL", () => {
  const node = buildArticleNode({
    siteUrl: "https://thedentallounge.com",
    path: "/case-studies/x",
    headline: "X",
    description: "",
    image: null,
    datePublished: "2026-01-01T00:00:00.000Z",
    dateModified: "2026-01-01T00:00:00.000Z",
    authorName: "Dr. Karim Elshibiny",
    clinicId: "https://thedentallounge.com/#clinic",
  });
  assert.equal(node.image, undefined);
  assert.equal(node.description, undefined);
});

test("wrapGraph produces a standalone context+graph from loose nodes", () => {
  const graph = wrapGraph([{ "@type": "BreadcrumbList" }, { "@type": "Article" }]);
  assert.equal(graph["@context"], "https://schema.org");
  assert.equal(graph["@graph"].length, 2);
});

test("MedicalProcedure gets its own url when the service has a slug", () => {
  const graph = buildClinicGraph({
    locale: "en",
    siteUrl: "https://thedentallounge.com",
    settings: SETTINGS,
    hours: HOURS,
    services: SERVICES,
  });
  const withSlug = graph["@graph"].find((n: { "@id"?: string }) => n["@id"]?.endsWith("#service-s1"));
  assert.equal(withSlug.url, "https://thedentallounge.com/services/teeth-whitening");

  const withoutSlug = graph["@graph"].find((n: { "@id"?: string }) => n["@id"]?.endsWith("#service-s2"));
  assert.equal(withoutSlug.url, undefined);
});

test("the service url reflects the current locale", () => {
  const graph = buildClinicGraph({
    locale: "ar",
    siteUrl: "https://thedentallounge.com",
    settings: SETTINGS,
    hours: HOURS,
    services: SERVICES,
  });
  const withSlug = graph["@graph"].find((n: { "@id"?: string }) => n["@id"]?.endsWith("#service-s1"));
  assert.equal(withSlug.url, "https://thedentallounge.com/ar/services/teeth-whitening");
});

// --- FAQPage ---

test("buildFaqPageNode maps published FAQs into Question/Answer pairs", () => {
  const node = buildFaqPageNode({
    locale: "en",
    items: [
      {
        id: "f1",
        question: "Is laser whitening safe?",
        question_ar: "",
        answer: "Yes, it is a well-established, low-sensitivity procedure.",
        answer_ar: "",
        sort_order: 1,
      },
      {
        id: "f2",
        question: "Do you treat children?",
        question_ar: "",
        answer: "Yes, we offer pediatric dentistry.",
        answer_ar: "",
        sort_order: 0,
      },
    ],
  });
  assert.equal(node?.["@type"], "FAQPage");
  const questions = node?.mainEntity as { name: string }[];
  // Sorted by sort_order, not insertion order.
  assert.deepEqual(
    questions.map((q) => q.name),
    ["Do you treat children?", "Is laser whitening safe?"],
  );
  const first = node?.mainEntity[0];
  assert.equal(first.acceptedAnswer["@type"], "Answer");
  assert.equal(first.acceptedAnswer.text, "Yes, we offer pediatric dentistry.");
});

test("buildFaqPageNode localizes into Arabic when filled in", () => {
  const node = buildFaqPageNode({
    locale: "ar",
    items: [
      {
        id: "f1",
        question: "Is laser whitening safe?",
        question_ar: "هل تبييض الأسنان بالليزر آمن؟",
        answer: "Yes.",
        answer_ar: "نعم.",
        sort_order: 0,
      },
    ],
  });
  assert.equal(node?.mainEntity[0].name, "هل تبييض الأسنان بالليزر آمن؟");
  assert.equal(node?.mainEntity[0].acceptedAnswer.text, "نعم.");
});

test("buildFaqPageNode skips a question with no answer — never fabricates one", () => {
  const node = buildFaqPageNode({
    locale: "en",
    items: [
      { id: "f1", question: "Question with no answer", question_ar: "", answer: "", answer_ar: "", sort_order: 0 },
    ],
  });
  assert.equal(node, null);
});

test("buildFaqPageNode returns null for an empty list rather than an empty FAQPage", () => {
  assert.equal(buildFaqPageNode({ locale: "en", items: [] }), null);
});
