import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { buildQuickReplyValues, formatHoursForPatient } from "./quickReplyValues.ts";

const base = {
  lang: "en" as const,
  contactName: "WhatsApp Name",
  patientDisplayName: null,
  reservations: [],
  clinic: { phone: "+20 100 000 0000", address: "Road 90, New Cairo" },
  hours: { open_weekdays: [0, 1, 2, 3, 4], time_windows: ["10:00-18:00"], timezone: "Africa/Cairo" },
  location: { latitude: 30.0074, longitude: 31.4913 },
};

describe("buildQuickReplyValues", () => {
  it("uses the linked patient's first name first", () => {
    const values = buildQuickReplyValues({
      ...base,
      patientDisplayName: "Mona Adel",
      reservations: [{ patient_name: "Other Person", service_label: null, starts_at: "2026-07-15T07:00:00Z" }],
    });
    assert.equal(values.name, "Mona");
  });

  it("falls back to the reservation name, then the WhatsApp contact name", () => {
    const fromReservation = buildQuickReplyValues({
      ...base,
      reservations: [{ patient_name: "Karim Samy", service_label: null, starts_at: "2026-07-15T07:00:00Z" }],
    });
    assert.equal(fromReservation.name, "Karim");
    assert.equal(buildQuickReplyValues(base).name, "WhatsApp");
  });

  it("leaves the name out when nothing is known", () => {
    assert.equal(buildQuickReplyValues({ ...base, contactName: "  " }).name, undefined);
  });

  it("leaves appointment fields out when there is no upcoming visit", () => {
    const values = buildQuickReplyValues(base);
    assert.equal(values.next_appointment, undefined);
    assert.equal(values.appointment_service, undefined);
  });

  it("formats the next appointment in the clinic's timezone", () => {
    // 07:00 UTC on 15 July is 10:00 in Cairo (UTC+3 in summer).
    const values = buildQuickReplyValues({
      ...base,
      reservations: [{ patient_name: null, service_label: "Cleaning", starts_at: "2026-07-15T07:00:00Z" }],
    });
    assert.match(values.next_appointment ?? "", /15 July 2026/);
    assert.match(values.next_appointment ?? "", /10:00/);
    assert.equal(values.appointment_service, "Cleaning");
  });

  it("writes Arabic dates with Western digits", () => {
    const values = buildQuickReplyValues({
      ...base,
      lang: "ar",
      reservations: [{ patient_name: null, service_label: null, starts_at: "2026-07-15T07:00:00Z" }],
    });
    assert.match(values.next_appointment ?? "", /2026/);
    assert.match(values.next_appointment ?? "", /10:00/);
  });

  it("always fills the clinic details", () => {
    const values = buildQuickReplyValues(base);
    assert.equal(values.clinic_address, "Road 90, New Cairo");
    assert.equal(values.clinic_phone, "+20 100 000 0000");
    assert.equal(values.maps_link, "https://www.google.com/maps?q=30.0074,31.4913");
    assert.equal(values.clinic_hours, "Sunday to Thursday, 10:00 to 18:00");
  });
});

describe("formatHoursForPatient", () => {
  it("reads naturally in English with several time windows", () => {
    assert.equal(
      formatHoursForPatient({ open_weekdays: [0], time_windows: ["10:00-13:00", "14:00-18:00"] }, "en"),
      "Sunday, 10:00 to 13:00 and 14:00 to 18:00",
    );
  });

  it("reads naturally in Arabic", () => {
    assert.equal(
      formatHoursForPatient({ open_weekdays: [0, 1, 2, 3, 4], time_windows: ["10:00-18:00"] }, "ar"),
      "الأحد إلى الخميس، 10:00 إلى 18:00",
    );
  });

  it("returns null when hours are not configured, so the field stays unfilled", () => {
    assert.equal(formatHoursForPatient(null, "en"), null);
    assert.equal(formatHoursForPatient({ open_weekdays: [], time_windows: ["10:00-18:00"] }, "en"), null);
  });
});
