type FaqInput = {
  id: string;
  question?: string | null;
  question_ar?: string | null;
  answer?: string | null;
  answer_ar?: string | null;
  sort_order: number;
};

type Bilingual = { en: string; ar: string };

export type PublicFaqPayload = {
  id: string;
  question: Bilingual;
  answer: Bilingual;
};

function text(value: string | null | undefined): string {
  return (value ?? "").trim();
}

function bilingual(en: string | null | undefined, ar: string | null | undefined): Bilingual {
  const enText = text(en);
  const arText = text(ar);
  return { en: enText, ar: arText || enText };
}

/** Pure builder for GET /api/v1/public/faq. Excludes any FAQ with no real
 * answer in either language — matches buildFaqPageNode's rule that
 * structured data never describes a question nobody has answered yet. */
export function buildPublicFaqPayload(faqs: FaqInput[]): PublicFaqPayload[] {
  return faqs
    .filter((faq) => text(faq.question) && (text(faq.answer) || text(faq.answer_ar)))
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((faq) => ({
      id: faq.id,
      question: bilingual(faq.question, faq.question_ar),
      answer: bilingual(faq.answer, faq.answer_ar),
    }));
}
