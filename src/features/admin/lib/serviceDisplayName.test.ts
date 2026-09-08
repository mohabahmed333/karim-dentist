import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  GENERAL_CONSULTATION_LABEL_EN,
  resolveServiceLabel,
  serviceDisplayName,
} from "./serviceDisplayName.ts";

const services = [
  {
    id: "1",
    title: "Dental implants",
    title_ar: "زراعة الأسنان",
  },
  {
    id: "2",
    title: "Aligners",
    title_ar: "",
  },
];

describe("serviceDisplayName", () => {
  it("prefers Arabic when locale is ar and title_ar is set", () => {
    assert.equal(serviceDisplayName("ar", services[0]!), "زراعة الأسنان");
  });

  it("falls back to English when Arabic is empty", () => {
    assert.equal(serviceDisplayName("ar", services[1]!), "Aligners");
  });

  it("uses English for en locale", () => {
    assert.equal(serviceDisplayName("en", services[0]!), "Dental implants");
  });
});

describe("resolveServiceLabel", () => {
  it("resolves via service_id when present", () => {
    assert.equal(
      resolveServiceLabel({
        locale: "ar",
        serviceId: "1",
        storedLabel: "Dental implants",
        services,
        consultationLabel: "استشارة عامة",
      }),
      "زراعة الأسنان",
    );
  });

  it("maps general consultation stored labels to localized consult", () => {
    assert.equal(
      resolveServiceLabel({
        locale: "ar",
        serviceId: null,
        storedLabel: GENERAL_CONSULTATION_LABEL_EN,
        services,
        consultationLabel: "استشارة عامة",
      }),
      "استشارة عامة",
    );
  });

  it("falls back to stored label when service is missing", () => {
    assert.equal(
      resolveServiceLabel({
        locale: "ar",
        serviceId: "missing",
        storedLabel: "Legacy service",
        services,
        consultationLabel: "استشارة عامة",
      }),
      "Legacy service",
    );
  });
});
