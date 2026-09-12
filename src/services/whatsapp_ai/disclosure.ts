export type ReplyLanguage = "ar" | "en";

const DISCLOSURE: Record<ReplyLanguage, string> = {
  ar: "أنا المساعد الآلي للعيادة. لو حابب تكلم أحد الزملاء، اكتب «موظف» في أي وقت.",
  en: "I'm the clinic's automated assistant. Reply “human” any time to reach a person.",
};

const HUMAN_OFFER: Record<ReplyLanguage, string> = {
  ar: "لو تحب، أقدر أحوّلك لأحد الزملاء — اكتب «موظف».",
  en: "If you'd like, I can connect you with a colleague — just reply “human”.",
};

const HANDOFF_ACK: Record<ReplyLanguage, string> = {
  ar: "تمام، حوّلتك لأحد الزملاء وهيرد عليك في أقرب وقت.",
  en: "Of course — I've passed you to a colleague, who will reply shortly.",
};

/** Struggling turns in a row before a person is offered unprompted. */
export const STRUGGLE_THRESHOLD = 2;

function lang(language: string | null | undefined): ReplyLanguage {
  return language === "ar" ? "ar" : "en";
}

/**
 * Prefix the assistant's first message in a conversation with who it is.
 *
 * Once per conversation, not on every reply: the patient needs to know they
 * are talking to software and how to reach a person, not to be told on every
 * message.
 */
export function withDisclosure(
  reply: string,
  language: string | null | undefined,
  isFirstAiReply: boolean,
): string {
  return isFirstAiReply ? `${DISCLOSURE[lang(language)]}\n\n${reply}` : reply;
}

/** Offer a person after repeated trouble, without repeating the offer. */
export function withHumanOffer(
  reply: string,
  language: string | null | undefined,
  recentStruggles: number,
): string {
  if (recentStruggles < STRUGGLE_THRESHOLD) return reply;
  const offer = HUMAN_OFFER[lang(language)];
  return reply.includes(offer) ? reply : `${reply}\n\n${offer}`;
}

/** What the patient is told the moment they are handed to a colleague. */
export function handoffAck(language: string | null | undefined): string {
  return HANDOFF_ACK[lang(language)];
}
