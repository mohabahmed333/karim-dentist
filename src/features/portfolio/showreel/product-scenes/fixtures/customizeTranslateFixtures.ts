export const CUSTOMIZE_TRANSLATE_FIXTURE = {
  heroBefore: {
    headline: "Care that feels calm",
    body: "Book a visit and meet your dental team.",
    cta: "Set Appointment",
  },
  heroEdit: {
    headline: "Care that feels calm · live edit",
    body: "Same-day whitening and gentle check-ups — book in under a minute.",
    cta: "Book your visit",
  },
  heroAfter: {
    headline: "رعاية تشعر بالهدوء",
    body: "تبييض في نفس اليوم وفحوصات لطيفة — احجز خلال دقيقة.",
    cta: "احجز زيارتك",
  },
  modules: ["hero", "services", "gallery", "contact"] as const,
  progressSteps: [
    { done: 0, total: 12, label: "Translating All modules to Arabic…" },
    { done: 6, total: 12, label: "Translating All modules to Arabic…" },
    { done: 12, total: 12, label: "Translation complete" },
  ],
  rtlAfter: false,
};
