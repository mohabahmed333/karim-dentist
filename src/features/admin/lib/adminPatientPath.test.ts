import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canAddClinicalNote,
  patientKeyFromAdminPath,
  shouldHideAdminChatBubbles,
} from "./adminPatientPath.ts";

describe("patientKeyFromAdminPath", () => {
  it("returns null outside patient routes", () => {
    assert.equal(patientKeyFromAdminPath("/admin"), null);
    assert.equal(patientKeyFromAdminPath("/admin/patients"), null);
    assert.equal(patientKeyFromAdminPath("/admin/reservations"), null);
    assert.equal(patientKeyFromAdminPath("/admin/support"), null);
  });

  it("extracts the patient key from profile and workspace paths", () => {
    assert.equal(
      patientKeyFromAdminPath("/admin/patients/phone%3A201012345678"),
      "phone:201012345678",
    );
    assert.equal(
      patientKeyFromAdminPath("/admin/patients/phone%3A201012345678/workspace"),
      "phone:201012345678",
    );
  });

  it("handles unencoded simple keys", () => {
    assert.equal(
      patientKeyFromAdminPath("/admin/patients/name:mohab"),
      "name:mohab",
    );
  });
});

describe("canAddClinicalNote", () => {
  it("is true only when a patient is open", () => {
    assert.equal(canAddClinicalNote("/admin/patients"), false);
    assert.equal(
      canAddClinicalNote("/admin/patients/phone%3A201012345678"),
      true,
    );
    assert.equal(
      canAddClinicalNote("/admin/patients/phone%3A201012345678/workspace"),
      true,
    );
  });
});

describe("shouldHideAdminChatBubbles", () => {
  it("hides on full WhatsApp support and open patient clinical UI", () => {
    assert.equal(shouldHideAdminChatBubbles("/admin/support"), true);
    assert.equal(
      shouldHideAdminChatBubbles("/admin/patients/phone%3A201012345678"),
      true,
    );
    assert.equal(
      shouldHideAdminChatBubbles(
        "/admin/patients/phone%3A201012345678/workspace",
      ),
      true,
    );
  });

  it("keeps the FAB on overview, patient list, and other admin pages", () => {
    assert.equal(shouldHideAdminChatBubbles("/admin"), false);
    assert.equal(shouldHideAdminChatBubbles("/admin/patients"), false);
    assert.equal(shouldHideAdminChatBubbles("/admin/reservations"), false);
    assert.equal(shouldHideAdminChatBubbles("/admin/customize"), false);
  });
});
