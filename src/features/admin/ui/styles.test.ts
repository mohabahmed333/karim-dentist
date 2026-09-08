import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  adminFieldClass,
  adminMenuItemClass,
  adminMenuPanelClass,
} from "./styles.ts";

describe("admin ui styles", () => {
  it("exposes shared menu + field class tokens", () => {
    assert.match(adminMenuPanelClass, /rounded-\[10px\]/);
    assert.match(adminMenuItemClass, /F2F2F2/);
    assert.match(adminFieldClass, /admin-border/);
  });
});
