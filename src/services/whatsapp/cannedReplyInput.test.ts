import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createCannedReplySchema,
  findButtonLabelProblems,
  QUICK_REPLY_BUTTON_TITLE_MAX,
  QUICK_REPLY_MAX_FILE_BYTES,
  updateCannedReplySchema,
  // @ts-expect-error -- Node strip-types needs the extension.
} from "./cannedReplyInput.ts";

const valid = { slash_key: "Visit", title: "Visit", body: "Hi {{name}}" };

describe("createCannedReplySchema", () => {
  it("lower-cases the slash key", () => {
    const parsed = createCannedReplySchema.parse(valid);
    assert.equal(parsed.slash_key, "visit");
  });

  it("rejects a slash key staff could not type after /", () => {
    assert.equal(createCannedReplySchema.safeParse({ ...valid, slash_key: "two words" }).success, false);
  });

  it("rejects an unknown fill-in field in either language", () => {
    const english = createCannedReplySchema.safeParse({ ...valid, body: "Hi {{nmae}}" });
    assert.equal(english.success, false);
    const arabic = createCannedReplySchema.safeParse({ ...valid, body_ar: "مرحبا {{nmae}}" });
    assert.equal(arabic.success, false);
    assert.deepEqual(arabic.error?.issues[0]?.path, ["body_ar"]);
  });

  it("accepts a clinic location attachment", () => {
    assert.equal(createCannedReplySchema.safeParse({ ...valid, attachment: { kind: "location" } }).success, true);
  });

  it("rejects a PDF passed off as an image", () => {
    const attachment = { kind: "image", mime: "application/pdf", path: "a.pdf", name: "a.pdf", size: 10 };
    assert.equal(createCannedReplySchema.safeParse({ ...valid, attachment }).success, false);
  });

  it("rejects files larger than the send route can carry", () => {
    const attachment = {
      kind: "document",
      mime: "application/pdf",
      path: "a.pdf",
      name: "a.pdf",
      size: QUICK_REPLY_MAX_FILE_BYTES + 1,
    };
    assert.equal(createCannedReplySchema.safeParse({ ...valid, attachment }).success, false);
  });
});

describe("updateCannedReplySchema", () => {
  it("refuses an empty update", () => {
    assert.equal(updateCannedReplySchema.safeParse({}).success, false);
  });

  it("allows switching a reply off on its own", () => {
    assert.deepEqual(updateCannedReplySchema.parse({ active: false }), { active: false });
  });

  it("still rejects unknown fields on edit", () => {
    assert.equal(updateCannedReplySchema.safeParse({ body: "{{coupon}}" }).success, false);
  });
});

describe("quick reply buttons", () => {
  it("trims labels and stores a blank Arabic label as null", () => {
    const parsed = createCannedReplySchema.parse({
      ...valid,
      buttons: [
        { title: " Book now ", title_ar: "   " },
        { title: "Call me", title_ar: " اتصلوا بي " },
      ],
    });
    assert.deepEqual(parsed.buttons, [
      { title: "Book now", title_ar: null },
      { title: "Call me", title_ar: "اتصلوا بي" },
    ]);
  });

  it("stores an empty list as no buttons", () => {
    assert.equal(createCannedReplySchema.parse({ ...valid, buttons: [] }).buttons, null);
  });

  it("allows three buttons and rejects a fourth", () => {
    const three = [{ title: "A" }, { title: "B" }, { title: "C" }];
    assert.equal(createCannedReplySchema.safeParse({ ...valid, buttons: three }).success, true);
    assert.equal(
      createCannedReplySchema.safeParse({ ...valid, buttons: [...three, { title: "D" }] }).success,
      false,
    );
  });

  it("rejects a label longer than WhatsApp allows", () => {
    const title = "x".repeat(QUICK_REPLY_BUTTON_TITLE_MAX + 1);
    assert.equal(createCannedReplySchema.safeParse({ ...valid, buttons: [{ title }] }).success, false);
  });

  it("rejects duplicate English labels, ignoring case and spaces", () => {
    const result = createCannedReplySchema.safeParse({
      ...valid,
      buttons: [{ title: "Yes" }, { title: " yes " }],
    });
    assert.equal(result.success, false);
    assert.deepEqual(result.error?.issues[0]?.path, ["buttons"]);
  });

  it("rejects duplicate Arabic labels but allows several blank ones", () => {
    const duplicate = [
      { title: "A", title_ar: "نعم" },
      { title: "B", title_ar: "نعم" },
    ];
    assert.equal(createCannedReplySchema.safeParse({ ...valid, buttons: duplicate }).success, false);
    const blank = [{ title: "A", title_ar: "" }, { title: "B" }];
    assert.equal(createCannedReplySchema.safeParse({ ...valid, buttons: blank }).success, true);
  });

  it("rejects fill-in fields in a label", () => {
    assert.equal(
      createCannedReplySchema.safeParse({ ...valid, buttons: [{ title: "Hi {{name}}" }] }).success,
      false,
    );
    assert.equal(
      createCannedReplySchema.safeParse({ ...valid, buttons: [{ title: "Hi", title_ar: "{{name}}" }] })
        .success,
      false,
    );
  });

  it("clears buttons on update with null", () => {
    assert.deepEqual(updateCannedReplySchema.parse({ buttons: null }), { buttons: null });
  });
});

describe("findButtonLabelProblems", () => {
  it("reports each problem once", () => {
    assert.deepEqual(
      findButtonLabelProblems([
        { title: "Yes", title_ar: "نعم" },
        { title: "yes", title_ar: "نعم" },
        { title: "Yes", title_ar: "{{name}}" },
      ]).sort(),
      ["duplicate_ar", "duplicate_en", "field_in_label"],
    );
  });

  it("finds nothing wrong with distinct plain labels", () => {
    assert.deepEqual(findButtonLabelProblems([{ title: "Book" }, { title: "Call", title_ar: null }]), []);
  });
});
