import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import {
  addableCatalog,
  canRemoveFromMenu,
  moreMenuItems,
  resolveClinicMenu,
} from "./menu.ts";

describe("clinic menu helpers", () => {
  it("joins fees to catalog names and skips unknown codes", () => {
    const menu = resolveClinicMenu([
      { code: "D2391", fee_egp: 175 },
      { code: "D9999", fee_egp: 10 },
    ]);
    assert.equal(menu.length, 1);
    assert.equal(menu[0]?.code, "D2391");
    assert.equal(menu[0]?.shortLabel, "Fill");
    assert.equal(menu[0]?.fee, 175);
    assert.equal(menu[0]?.group, "filling");
  });

  it("lists catalog entries not already on the menu", () => {
    const addable = addableCatalog(new Set(["D2391"]));
    assert.equal(addable.some((row) => row.code === "D2391"), false);
    assert.equal(addable.some((row) => row.code === "D2740"), true);
  });

  it("blocks remove when a favorite slot uses the code", () => {
    const presets = [{ slot: 1, code: "D2391", label: "+ Fill" }];
    assert.equal(canRemoveFromMenu("D2391", presets), false);
    assert.equal(canRemoveFromMenu("D2740", presets), true);
  });

  it("excludes favorite codes from More items", () => {
    const menu = resolveClinicMenu([
      { code: "D2391", fee_egp: 150 },
      { code: "D1110", fee_egp: 80 },
    ]);
    const more = moreMenuItems(menu, [
      { slot: 1, code: "D2391", label: "+ Fill" },
    ]);
    assert.equal(more.length, 1);
    assert.equal(more[0]?.code, "D1110");
  });
});
