import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { templateDummyDefaults } from "./templateDefaultValues.ts";

test("templateDummyDefaults uses Arabic samples for ar language", () => {
  const values = templateDummyDefaults(
    [
      { section: "body", key: "1", label: "{{1}}" },
      { section: "body", key: "name", label: "{{name}}" },
    ],
    "ar",
  );
  assert.equal(values["body.1"], "أحمد");
  assert.equal(values["body.name"], "أحمد");
});

test("templateDummyDefaults uses English samples for en language", () => {
  const values = templateDummyDefaults(
    [
      { section: "header", key: "1", label: "{{1}}" },
      { section: "body", key: "clinic", label: "{{clinic}}" },
    ],
    "en_US",
  );
  assert.equal(values["header.1"], "Ahmed");
  assert.equal(values["body.clinic"], "Dental Lounge");
});
