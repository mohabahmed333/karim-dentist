import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { buildClinicGraph } from "./jsonLd.ts";

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
  },
  {
    id: "s2",
    title: "Gingivectomy",
    title_ar: "",
    description: "",
    description_ar: "",
    kind: "laser",
    sort_order: 1,
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
  const orgNodes = graph["@graph"].filter((n: { "@type"?: unknown }) => {
    const type = n["@type"];
    return type === "Organization" || (Array.isArray(type) && type.includes("Organization") && !Array.isArray(type[0]));
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
