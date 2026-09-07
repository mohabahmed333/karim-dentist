import assert from "node:assert/strict";
import test from "node:test";
import {
  parseShowreelDemoParams,
  SHOWREEL_CUSTOMIZE_DEMO,
  type ShowreelCustomizeDemoMessage,
} from "./showreelEmbedMessage.ts";
import {
  resolveShowreelCaseStudyItemId,
  resolveShowreelFocusField,
} from "./showreelDemoRouteHelpers.ts";

test("parses item and focus from demo query strings", () => {
  const params = parseShowreelDemoParams(
    "/showreel/demo?mode=customize&section=case-studies&item=first&focus=title",
  );

  assert.deepEqual(params, {
    section: "case-studies",
    view: undefined,
    item: "first",
    focus: "title",
  });
});

test("resolves first case study id from item=first", () => {
  assert.equal(
    resolveShowreelCaseStudyItemId("first", ["cs-1", "cs-2"]),
    "cs-1",
  );
  assert.equal(resolveShowreelCaseStudyItemId("cs-2", ["cs-1", "cs-2"]), "cs-2");
  assert.equal(resolveShowreelCaseStudyItemId(undefined, ["cs-1"]), null);
});

test("maps focus query to editor focusField", () => {
  assert.equal(resolveShowreelFocusField("title"), "title");
  assert.equal(resolveShowreelFocusField(undefined), null);
});

test("exports customize demo message type for live patches", () => {
  const message: ShowreelCustomizeDemoMessage = {
    type: SHOWREEL_CUSTOMIZE_DEMO,
    action: "patchCaseStudy",
    payload: { title: "New title" },
  };
  assert.equal(message.type, "showreel-customize-demo");
  assert.equal(message.action, "patchCaseStudy");
});
