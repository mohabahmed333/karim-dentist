import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { previewDeviceFrameStyle } from "./previewDeviceFrameStyle.ts";

describe("previewDeviceFrameStyle", () => {
  it("caps mobile width and max-height to the device spec", () => {
    const style = previewDeviceFrameStyle("mobile");
    assert.match(style.width, /430/);
    assert.match(style.maxHeight, /932/);
  });

  it("caps tablet to 834×1112", () => {
    const style = previewDeviceFrameStyle("tablet");
    assert.match(style.width, /834/);
    assert.match(style.maxHeight, /1112/);
  });
});
