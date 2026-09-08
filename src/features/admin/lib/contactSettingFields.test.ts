import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CONTACT_SETTING_FIELDS,
  groupedContactSettingFields,
} from "./contactSettingFields.ts";

describe("groupedContactSettingFields", () => {
  it("splits location and contact into two full-width groups", () => {
    const groups = groupedContactSettingFields();
    assert.deepEqual(
      groups.map((group) => group.id),
      ["location", "contact"],
    );
    assert.equal(groups[0]?.title, "Location");
    assert.equal(groups[1]?.title, "Contact");
  });

  it("puts address and map with location, phones and social with contact", () => {
    const groups = groupedContactSettingFields();
    const locationIds = groups[0]?.fields.map((field) => field.id) ?? [];
    const contactIds = groups[1]?.fields.map((field) => field.id) ?? [];

    assert.deepEqual(locationIds, [
      "contact_address",
      "contact_city",
      "contact_country",
      "contact_hours",
      "contact_map_url",
    ]);
    assert.ok(contactIds.includes("contact_phone"));
    assert.ok(contactIds.includes("contact_whatsapp"));
    assert.ok(!locationIds.includes("contact_email"));
  });

  it("covers every contact setting field exactly once", () => {
    const groupedIds = groupedContactSettingFields().flatMap((group) =>
      group.fields.map((field) => field.id),
    );
    const allIds = CONTACT_SETTING_FIELDS.map((field) => field.id);
    assert.deepEqual([...groupedIds].sort(), [...allIds].sort());
  });
});
