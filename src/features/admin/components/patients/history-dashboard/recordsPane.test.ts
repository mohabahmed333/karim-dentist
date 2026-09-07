import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import {
  closeRecords,
  openRecords,
  paneFromView,
  viewFromPane,
} from "./recordsPane.ts";

describe("recordsPane", () => {
  it("opens a named pane and closes to null", () => {
    assert.equal(openRecords("history"), "history");
    assert.equal(openRecords("clinical"), "clinical");
    assert.equal(openRecords("teeth"), "teeth");
    assert.equal(closeRecords(), null);
  });

  it("maps patient view tabs to overlay panes", () => {
    assert.equal(paneFromView("chairside"), null);
    assert.equal(paneFromView("history"), "history");
    assert.equal(viewFromPane(null), "chairside");
    assert.equal(viewFromPane("clinical"), "clinical");
  });
});
