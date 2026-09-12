import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import {
  INTERACTIVE_BODY_LIMIT,
  checkInteractiveButtons,
  checkInteractiveList,
  // @ts-expect-error -- Node strip-types needs the extension.
} from "./interactiveButtons.ts";

describe("checkInteractiveButtons", () => {
  const two = [{ title: "Confirm" }, { title: "Call me" }];

  it("accepts text within the limit with distinct titles", () => {
    assert.equal(checkInteractiveButtons("See you soon", two), null);
    assert.equal(checkInteractiveButtons("x".repeat(INTERACTIVE_BODY_LIMIT), two), null);
  });

  it("rejects a message without buttons", () => {
    assert.equal(checkInteractiveButtons("Hi", undefined), "no_buttons");
    assert.equal(checkInteractiveButtons("Hi", []), "no_buttons");
  });

  it("rejects text over WhatsApp's limit", () => {
    assert.equal(checkInteractiveButtons("x".repeat(INTERACTIVE_BODY_LIMIT + 1), two), "body_too_long");
  });

  it("rejects titles that differ only in case or spaces", () => {
    assert.equal(checkInteractiveButtons("Hi", [{ title: "Yes" }, { title: " yes" }]), "duplicate_titles");
  });
});

describe("checkInteractiveButtons — title length", () => {
  /** Meta rejects the message, not the button, so this protects the words too. */
  it("refuses a title longer than WhatsApp allows", () => {
    assert.equal(
      checkInteractiveButtons("Pick a time", [{ title: "x".repeat(21) }]),
      "title_too_long",
    );
  });

  it("accepts one exactly at the limit", () => {
    assert.equal(checkInteractiveButtons("Pick a time", [{ title: "x".repeat(20) }]), null);
  });

  it("still accepts ordinary slot labels in both languages", () => {
    assert.equal(
      checkInteractiveButtons("اختار الميعاد", [
        { title: "الأحد 10:30 ص" },
        { title: "الاثنين 2:00 م" },
      ]),
      null,
    );
  });
});

describe("checkInteractiveList", () => {
  const rows = [
    { id: "service:0", title: "زراعة الأسنان" },
    { id: "service:1", title: "تبييض الأسنان" },
  ];
  const list = { button: "اختار الخدمة", rows };

  it("accepts a realistic service list", () => {
    assert.equal(checkInteractiveList("أي خدمة تحب؟", list), null);
  });

  it("refuses an empty list rather than sending an unusable control", () => {
    assert.equal(checkInteractiveList("hi", { button: "Pick", rows: [] }), "no_rows");
  });

  it("refuses more rows than WhatsApp shows", () => {
    const many = Array.from({ length: 11 }, (_, i) => ({ id: `s:${i}`, title: `Service ${i}` }));
    assert.equal(checkInteractiveList("hi", { button: "Pick", rows: many }), "too_many_rows");
  });

  it("refuses a row title or description past the limit", () => {
    assert.equal(
      checkInteractiveList("hi", { button: "Pick", rows: [{ id: "a", title: "x".repeat(25) }] }),
      "row_title_too_long",
    );
    assert.equal(
      checkInteractiveList("hi", {
        button: "Pick",
        rows: [{ id: "a", title: "ok", description: "x".repeat(73) }],
      }),
      "row_description_too_long",
    );
  });

  it("refuses two rows that answer to the same id", () => {
    assert.equal(
      checkInteractiveList("hi", {
        button: "Pick",
        rows: [
          { id: "same", title: "One" },
          { id: "same", title: "Two" },
        ],
      }),
      "duplicate_row_ids",
    );
  });
});
