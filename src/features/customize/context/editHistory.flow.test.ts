import assert from "node:assert/strict";
import test from "node:test";
import {
  createHistory,
  historyFlags,
  pushHistory,
  redoHistory,
  resetHistory,
  undoHistory,
} from "./editHistory.ts";

function stubData(tag: string) {
  return {
    settings: { brand_name: tag },
    hero: null,
    about: null,
    callout: null,
    caseStudies: [],
    caseStudySections: {},
    caseStudyDetailPageIds: [],
    featured: [],
    featuredProjectSections: {},
    featuredDetailPageIds: [],
    experience: [],
    services: [],
    clients: [],
    footerLinks: [],
    socialLinks: [],
  } as Parameters<typeof createHistory>[0];
}

test("full discard + undo/redo session flow", () => {
  let state = createHistory(stubData("saved"));
  assert.deepEqual(historyFlags(state), { canUndo: false, canRedo: false });

  // Debounced edit A
  state = pushHistory(state, {
    data: stubData("edit-a"),
    pendingKeys: ["settings"],
  });
  // Debounced edit B
  state = pushHistory(state, {
    data: stubData("edit-b"),
    pendingKeys: ["settings"],
  });
  assert.equal(state.entries.length, 3);
  assert.equal(historyFlags(state).canUndo, true);

  // Undo to A
  state = undoHistory(state)!.state;
  assert.equal(state.entries[state.index]?.data.settings?.brand_name, "edit-a");
  assert.equal(historyFlags(state).canRedo, true);

  // Redo to B
  state = redoHistory(state)!.state;
  assert.equal(state.entries[state.index]?.data.settings?.brand_name, "edit-b");

  // Undo twice to saved
  state = undoHistory(state)!.state;
  state = undoHistory(state)!.state;
  assert.equal(state.entries[state.index]?.data.settings?.brand_name, "saved");
  assert.equal(historyFlags(state).canUndo, false);
  assert.equal(historyFlags(state).canRedo, true);

  // Discard / save resets
  state = resetHistory(stubData("saved"));
  assert.deepEqual(historyFlags(state), { canUndo: false, canRedo: false });
});
