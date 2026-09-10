import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { buildPublicClinicPayload } from "./publicClinicPayload.ts";

const SETTINGS = {
  brand_name: "The Dental Lounge",
  contact_clinic_name: "The Dental Lounge",
  contact_clinic_name_ar: "ذا دنتال لاونج",
  contact_doctor_name: "Dr. Karim Elshibiny",
  contact_doctor_name_ar: "د. كريم الشبيني",
  contact_credentials: "Mastership Laser Dentistry - Aachen, Germany",
  contact_credentials_ar: "",
  contact_address: "A 41 Ozone Medical Center, New Cairo, Al Narges Buildings",
  contact_city: "New Cairo",
  contact_country: "Egypt",
  contact_phone: "+20 111 192 2252",
  contact_whatsapp: "201111922252",
  contact_email: "hello@thedentallounge.com",
  contact_latitude: 30.02,
  contact_longitude: 31.49,
  contact_map_url: "https://maps.google.com/?q=clinic",
  contact_price_range: "$$",
  contact_instagram: "https://instagram.com/thedentallounge",
  contact_facebook: "",
  contact_linkedin: "",
  contact_x: "",
  contact_behance: "",
  contact_telegram: "",
};

const HOURS = {
  open_weekdays: [0, 1, 2, 3, 4],
  time_windows: ["10:00-18:00"],
  timezone: "Africa/Cairo",
};

test("carries bilingual identity fields as {en, ar} pairs", () => {
  const payload = buildPublicClinicPayload(SETTINGS, HOURS);
  assert.deepEqual(payload.name, { en: "The Dental Lounge", ar: "ذا دنتال لاونج" });
  assert.deepEqual(payload.doctor.name, {
    en: "Dr. Karim Elshibiny",
    ar: "د. كريم الشبيني",
  });
});

test("falls back to English when an Arabic field is blank", () => {
  const payload = buildPublicClinicPayload(SETTINGS, HOURS);
  assert.deepEqual(payload.doctor.credentials, {
    en: "Mastership Laser Dentistry - Aachen, Germany",
    ar: "Mastership Laser Dentistry - Aachen, Germany",
  });
});

test("includes structured hours alongside a human-readable summary", () => {
  const payload = buildPublicClinicPayload(SETTINGS, HOURS);
  assert.equal(payload.hours.text, "Sun–Thu 10:00–18:00 (Africa/Cairo)");
  assert.equal(payload.hours.specification?.length, 1);
  assert.equal(payload.hours.timezone, "Africa/Cairo");
});

test("omits hours entirely when the schedule is unknown, never guesses", () => {
  const payload = buildPublicClinicPayload(SETTINGS, null);
  assert.equal(payload.hours, null);
});

test("includes geo only when both coordinates are set", () => {
  const payload = buildPublicClinicPayload(SETTINGS, HOURS);
  assert.deepEqual(payload.geo, { latitude: 30.02, longitude: 31.49 });

  const noGeo = buildPublicClinicPayload(
    { ...SETTINGS, contact_latitude: null, contact_longitude: null },
    HOURS,
  );
  assert.equal(noGeo.geo, null);
});

test("collects only the social links that are actually set", () => {
  const payload = buildPublicClinicPayload(SETTINGS, HOURS);
  assert.deepEqual(payload.socialLinks, [
    "https://instagram.com/thedentallounge",
    "https://wa.me/201111922252",
  ]);
});

test("returns null for a missing settings row rather than throwing", () => {
  const payload = buildPublicClinicPayload(null, HOURS);
  assert.equal(payload, null);
});
