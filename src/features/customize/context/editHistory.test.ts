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

test("undoes and redoes steps", () => {
  let state = createHistory(stubData("a"));
  state = pushHistory(state, {
    data: stubData("b"),
    pendingKeys: ["settings"],
  });
  state = pushHistory(state, {
    data: stubData("c"),
    pendingKeys: ["settings"],
  });
  assert.deepEqual(historyFlags(state), { canUndo: true, canRedo: false });

  const back = undoHistory(state);
  assert.equal(back?.entry.data.settings?.brand_name, "b");
  state = back!.state;
  assert.equal(historyFlags(state).canRedo, true);

  const again = undoHistory(state);
  assert.equal(again?.entry.data.settings?.brand_name, "a");
  state = again!.state;
  assert.equal(historyFlags(state).canUndo, false);

  const forward = redoHistory(state);
  assert.equal(forward?.entry.data.settings?.brand_name, "b");
});

test("clears redo branch on new push", () => {
  let state = createHistory(stubData("a"));
  state = pushHistory(state, {
    data: stubData("b"),
    pendingKeys: ["settings"],
  });
  state = undoHistory(state)!.state;
  state = pushHistory(state, {
    data: stubData("d"),
    pendingKeys: ["settings"],
  });
  assert.equal(redoHistory(state), null);
  assert.equal(state.entries.length, 2);
});

test("resetHistory drops prior steps", () => {
  let state = createHistory(stubData("a"));
  state = pushHistory(state, {
    data: stubData("b"),
    pendingKeys: ["settings"],
  });
  state = resetHistory(stubData("saved"));
  assert.equal(state.index, 0);
  assert.deepEqual(historyFlags(state), { canUndo: false, canRedo: false });
});

test("keeps only last 10 edits plus baseline", () => {
  let state = createHistory(stubData("saved"));
  for (let i = 1; i <= 12; i += 1) {
    state = pushHistory(state, {
      data: stubData(`e${i}`),
      pendingKeys: ["settings"],
    });
  }
  assert.equal(state.entries.length, 11);
  assert.equal(state.entries[0]?.data.settings?.brand_name, "e2");
  assert.equal(state.entries[10]?.data.settings?.brand_name, "e12");
});
