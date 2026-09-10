import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { buildPublicFaqPayload } from "./publicFaqPayload.ts";

const FAQS = [
  {
    id: "f2",
    question: "Do you treat children?",
    question_ar: "",
    answer: "Yes, we offer pediatric dentistry.",
    answer_ar: "",
    sort_order: 0,
  },
  {
    id: "f1",
    question: "Is laser whitening safe?",
    question_ar: "هل تبييض الأسنان بالليزر آمن؟",
    answer: "Yes, it is well-established.",
    answer_ar: "نعم، إجراء معتمد.",
    sort_order: 1,
  },
  {
    id: "f3",
    question: "No answer yet",
    question_ar: "",
    answer: "",
    answer_ar: "",
    sort_order: 2,
  },
];

test("returns each FAQ with a real answer, sorted by sort_order", () => {
  const payload = buildPublicFaqPayload(FAQS);
  assert.deepEqual(
    payload.map((f) => f.id),
    ["f2", "f1"],
  );
});

test("excludes a question with no answer in either language", () => {
  const payload = buildPublicFaqPayload(FAQS);
  assert.ok(!payload.some((f) => f.id === "f3"));
});

test("carries bilingual question/answer pairs", () => {
  const payload = buildPublicFaqPayload(FAQS);
  const laser = payload.find((f) => f.id === "f1");
  assert.deepEqual(laser?.question, {
    en: "Is laser whitening safe?",
    ar: "هل تبييض الأسنان بالليزر آمن؟",
  });
  assert.deepEqual(laser?.answer, {
    en: "Yes, it is well-established.",
    ar: "نعم، إجراء معتمد.",
  });
});
