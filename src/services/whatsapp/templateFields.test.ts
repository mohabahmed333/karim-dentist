import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import {
  buildTemplateSendParts,
  parseTemplateFields,
  templateSupportsAppSend,
} from "./templateFields.ts";

test("templateSupportsAppSend rejects media headers", () => {
  assert.equal(
    templateSupportsAppSend([
      { type: "HEADER", format: "IMAGE" },
      { type: "BODY", text: "Hi" },
    ]),
    false,
  );
});

test("templateSupportsAppSend accepts text-only templates", () => {
  assert.equal(
    templateSupportsAppSend([
      { type: "HEADER", format: "TEXT", text: "Hello {{1}}" },
      { type: "BODY", text: "See you {{name}}" },
    ]),
    true,
  );
});

test("parseTemplateFields extracts positional and named placeholders", () => {
  const fields = parseTemplateFields([
    { type: "HEADER", format: "TEXT", text: "Hi {{1}}" },
    { type: "BODY", text: "Appt {{date}} for {{1}}" },
  ]);
  assert.deepEqual(
    fields.map((f) => ({ section: f.section, key: f.key })),
    [
      { section: "header", key: "1" },
      { section: "body", key: "date" },
      { section: "body", key: "1" },
    ],
  );
});

test("buildTemplateSendParts maps positional body params", () => {
  const parts = buildTemplateSendParts({
    fields: [{ section: "body", key: "1", label: "{{1}}" }],
    values: { "body.1": "Sara" },
  });
  assert.deepEqual(parts.body, [{ type: "text", text: "Sara" }]);
  assert.equal(parts.header, undefined);
});

test("buildTemplateSendParts maps named params", () => {
  const parts = buildTemplateSendParts({
    fields: [{ section: "body", key: "customer_name", label: "{{customer_name}}" }],
    values: { "body.customer_name": "Karim" },
    named: true,
  });
  assert.deepEqual(parts.body, [
    { type: "text", text: "Karim", parameterName: "customer_name" },
  ]);
});
