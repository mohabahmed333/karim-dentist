import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { firstJsonObject } from "./firstJsonObject.ts";

describe("firstJsonObject", () => {
  it("returns a bare object unchanged", () => {
    assert.equal(firstJsonObject('{"a":1}'), '{"a":1}');
  });

  it("pulls the object out of surrounding prose", () => {
    assert.equal(firstJsonObject('Sure! {"a":1} hope that helps'), '{"a":1}');
  });

  /** Models that ignore JSON mode wrap their answer in a fence. */
  it("pulls the object out of a ```json fence", () => {
    assert.equal(firstJsonObject('```json\n{"a":1}\n```'), '{"a":1}');
  });

  it("keeps nested objects whole", () => {
    const raw = '{"a":{"b":[{"c":2}]}}';
    assert.equal(firstJsonObject(raw), raw);
  });

  /** A brace inside a string is text, not structure. */
  it("ignores braces inside strings", () => {
    const raw = '{"reply":"use {curly} braces"}';
    assert.equal(firstJsonObject(raw), raw);
  });

  it("ignores an escaped quote inside a string", () => {
    const raw = '{"reply":"she said \\"hi\\" {x"}';
    assert.equal(firstJsonObject(raw), raw);
  });

  it("handles a trailing backslash inside a string", () => {
    const raw = '{"path":"C:\\\\temp"}';
    assert.equal(firstJsonObject(raw), raw);
  });

  /** Patients write Arabic; the scanner counts braces, not characters. */
  it("keeps Arabic content intact", () => {
    const raw = '{"language":"ar","reply":"تمام، حجزتلك الخميس ١٠:٣٠ صباحاً."}';
    assert.equal(firstJsonObject(`رد: ${raw}`), raw);
    assert.equal(JSON.parse(firstJsonObject(raw)!).reply, "تمام، حجزتلك الخميس ١٠:٣٠ صباحاً.");
  });

  it("returns null when there is no object at all", () => {
    assert.equal(firstJsonObject("I think we open at ten?"), null);
    assert.equal(firstJsonObject(""), null);
  });

  it("returns null when the object is never closed", () => {
    assert.equal(firstJsonObject('{"a":1'), null);
  });
});
