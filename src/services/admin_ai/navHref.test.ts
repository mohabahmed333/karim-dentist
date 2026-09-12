import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { hrefForNavAction } from "./navHref.ts";

describe("hrefForNavAction", () => {
  it("builds the patient page from patientKey", () => {
    assert.equal(
      hrefForNavAction({ kind: "navigate.open_patient", payload: { patientKey: "p 1" } }),
      "/admin/patients/p%201",
    );
  });

  it("builds the workspace tooth link", () => {
    assert.equal(
      hrefForNavAction({ kind: "navigate.focus_tooth", payload: { patientKey: "p1", fdi: "16" } }),
      "/admin/patients/p1/workspace?tooth=16",
    );
  });

  it("falls back to the chat's active patient for a tooth link", () => {
    assert.equal(
      hrefForNavAction({ kind: "navigate.focus_tooth", payload: { tooth_fdi: 26 } }, "p9"),
      "/admin/patients/p9/workspace?tooth=26",
    );
  });

  it("returns null when there is no patient to open", () => {
    assert.equal(hrefForNavAction({ kind: "navigate.focus_tooth", payload: { fdi: "16" } }), null);
    assert.equal(hrefForNavAction({ kind: "navigate.open_patient", payload: {} }), null);
  });

  it("accepts a model-supplied href only inside the admin", () => {
    assert.equal(
      hrefForNavAction({ kind: "navigate.open_patient", payload: { patientKey: "p1", href: "/admin/patients/p1/workspace" } }),
      "/admin/patients/p1/workspace",
    );
    for (const href of ["https://evil.example/admin", "//evil.example", "/admin/../../x", "javascript:alert(1)"]) {
      assert.equal(
        hrefForNavAction({ kind: "navigate.open_patient", payload: { patientKey: "p1", href } }),
        "/admin/patients/p1",
        href,
      );
    }
  });

  it("ignores write kinds", () => {
    assert.equal(hrefForNavAction({ kind: "reservation.cancel", payload: { patientKey: "p1" } }), null);
  });
});
