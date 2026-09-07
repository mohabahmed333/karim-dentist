import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement, Fragment } from "react";
// @ts-expect-error -- Node strip-types needs the extension.
import { formatWhatsappText } from "./formatWhatsappText.ts";

describe("formatWhatsappText", () => {
  it("formats bold italic strike and code", () => {
    const html = renderToStaticMarkup(
      createElement(
        Fragment,
        null,
        formatWhatsappText("Say *hi* _now_ ~later~ and `code`"),
      ),
    );
    assert.match(html, /<strong>hi<\/strong>/);
    assert.match(html, /<em>now<\/em>/);
    assert.match(html, /<s>later<\/s>/);
    assert.match(html, /code/);
  });

  it("escapes html via React text nodes", () => {
    const html = renderToStaticMarkup(
      createElement(Fragment, null, formatWhatsappText("<script>")),
    );
    assert.match(html, /&lt;script&gt;/);
    assert.equal(html.includes("<script>"), false);
  });
});
