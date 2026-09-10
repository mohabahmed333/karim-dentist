import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fireShowreelClick } from "./fireShowreelClick.ts";

describe("fireShowreelClick", () => {
  it("invokes click once so a toggle FAB stays open", () => {
    const events: string[] = [];
    fireShowreelClick({
      dispatchEvent: (event) => {
        events.push(event.type);
        return true;
      },
      click: () => {
        events.push("click");
      },
    });
    assert.deepEqual(events, ["click"]);
  });
});
