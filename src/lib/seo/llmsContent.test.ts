import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { buildLlmsFull, buildLlmsIndex } from "./llmsContent.ts";

const SETTINGS = {
  brand_name: "The Dental Lounge",
  contact_clinic_name: "The Dental Lounge",
  contact_doctor_name: "Dr. Karim Elshibiny",
  contact_credentials: "Mastership Laser Dentistry - Aachen, Germany",
  contact_headline: "Book your visit",
  contact_blurb: "Modern laser and cosmetic dentistry in New Cairo.",
  contact_address: "A 41 Ozone Medical Center, New Cairo, Al Narges Buildings",
  contact_city: "New Cairo",
  contact_country: "Egypt",
  contact_phone: "+20 111 192 2252",
  contact_whatsapp: "201111922252",
  contact_email: "hello@thedentallounge.com",
  case_studies_title: "Case studies",
  featured_title: "Projects",
  homepage_hidden_sections: [] as string[],
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
    title_ar: "",
    description: "Brighten your smile.",
    description_ar: "",
    kind: "our_services",
    sort_order: 1,
    slug: "teeth-whitening",
  },
  {
    id: "s2",
    title: "Untitled",
    title_ar: "",
    description: "",
    description_ar: "",
    kind: "laser",
    sort_order: 1,
  },
];

const CASE_STUDIES = [
  {
    slug: "example",
    title: "Example case",
    description: "A worked example.",
    is_published: true,
  },
];

const FAQS = [
  {
    id: "f1",
    question: "Is laser whitening safe?",
    answer: "Yes, it is a well-established, low-sensitivity procedure.",
    sort_order: 1,
    is_published: true,
  },
  {
    id: "f2",
    question: "Do you treat children?",
    answer: "Yes, we offer pediatric dentistry.",
    sort_order: 0,
    is_published: true,
  },
  {
    id: "f3",
    question: "Draft question",
    answer: "",
    sort_order: 2,
    is_published: false,
  },
];

test("index lists NAP, hours, and the services and pages sections", () => {
  const text = buildLlmsIndex({
    siteUrl: "https://thedentallounge.com",
    settings: SETTINGS,
    hours: HOURS,
    services: SERVICES,
  });
  assert.match(text, /^# The Dental Lounge/);
  assert.match(text, /A 41 Ozone Medical Center/);
  assert.match(text, /\+20 111 192 2252/);
  assert.match(text, /https:\/\/wa\.me\/201111922252/);
  assert.match(text, /Sun–Thu 10:00–18:00 \(Africa\/Cairo\)/);
  assert.match(text, /## Services/);
  assert.match(text, /Teeth whitening/);
  // Placeholder titles never appear.
  assert.ok(!text.includes("Untitled"));
  assert.match(text, /Languages: \[English\]\(https:\/\/thedentallounge\.com\/\), \[Arabic \(العربية\)\]\(https:\/\/thedentallounge\.com\/ar\)/);
  assert.match(text, /## Pages/);
  assert.match(text, /https:\/\/thedentallounge\.com\/case-studies/);
  assert.match(text, /llms-full\.txt/);
  assert.match(text, /sitemap\.xml/);
  assert.match(text, /\/api\/v1\/public\/clinic/);
  assert.match(text, /\/api\/v1\/public\/services/);
  assert.match(text, /\/api\/v1\/public\/faq/);
});

test("index omits a section's link when it is hidden on the homepage", () => {
  const text = buildLlmsIndex({
    siteUrl: "https://thedentallounge.com",
    settings: { ...SETTINGS, homepage_hidden_sections: ["case-studies"] },
    hours: HOURS,
    services: SERVICES,
  });
  assert.ok(!text.includes("thedentallounge.com/case-studies"));
  // Featured is still visible.
  assert.match(text, /https:\/\/thedentallounge\.com\/featured/);
});

test("index never invites an automated booking POST — WhatsApp/phone only", () => {
  const text = buildLlmsIndex({
    siteUrl: "https://thedentallounge.com",
    settings: SETTINGS,
    hours: HOURS,
    services: SERVICES,
  });
  assert.ok(!text.includes("/api/v1/booking"));
});

test("full dump includes service descriptions, about copy, and published case studies", () => {
  const text = buildLlmsFull({
    siteUrl: "https://thedentallounge.com",
    settings: SETTINGS,
    hours: HOURS,
    services: SERVICES,
    aboutBody: "The Dental Lounge blends laser precision with comfort-first care.",
    caseStudies: CASE_STUDIES,
  });
  assert.match(text, /Brighten your smile\./);
  assert.match(text, /laser precision with comfort-first care/);
  assert.match(text, /Example case/);
  assert.match(text, /A worked example\./);
  assert.match(text, /https:\/\/thedentallounge\.com\/case-studies\/example/);
});

test("full dump skips unpublished case studies", () => {
  const text = buildLlmsFull({
    siteUrl: "https://thedentallounge.com",
    settings: SETTINGS,
    hours: HOURS,
    services: SERVICES,
    aboutBody: "",
    caseStudies: [{ ...CASE_STUDIES[0], is_published: false }],
  });
  assert.ok(!text.includes("Example case"));
});

test("index links each service to its own page when it has a slug", () => {
  const text = buildLlmsIndex({
    siteUrl: "https://thedentallounge.com",
    settings: SETTINGS,
    hours: HOURS,
    services: SERVICES,
  });
  assert.match(
    text,
    /- \[Teeth whitening\]\(https:\/\/thedentallounge\.com\/services\/teeth-whitening\)/,
  );
});

test("full dump includes published FAQs, sorted, skipping drafts", () => {
  const text = buildLlmsFull({
    siteUrl: "https://thedentallounge.com",
    settings: SETTINGS,
    hours: HOURS,
    services: SERVICES,
    aboutBody: "",
    caseStudies: [],
    faqs: FAQS,
  });
  assert.match(text, /## FAQ/);
  const childrenIndex = text.indexOf("Do you treat children?");
  const whiteningIndex = text.indexOf("Is laser whitening safe?");
  assert.ok(childrenIndex > 0 && whiteningIndex > 0);
  // sort_order 0 before sort_order 1.
  assert.ok(childrenIndex < whiteningIndex);
  assert.ok(!text.includes("Draft question"));
});

test("full dump omits the FAQ section entirely when there are none", () => {
  const text = buildLlmsFull({
    siteUrl: "https://thedentallounge.com",
    settings: SETTINGS,
    hours: HOURS,
    services: SERVICES,
    aboutBody: "",
    caseStudies: [],
    faqs: [],
  });
  assert.ok(!text.includes("## FAQ"));
});
