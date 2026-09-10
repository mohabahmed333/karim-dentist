import type { ShowreelFeatureSlide, ShowreelSlide } from "./showreelSlideTypes";

const SITE_MOBILE = "/showreel/demo?mode=site&viewport=mobile";
const PRODUCT = (scene: NonNullable<ShowreelFeatureSlide["productScene"]>) =>
  `/showreel/demo?mode=product&scene=${scene}`;

const FEATURE = (
  id: string,
  kicker: string,
  title: string,
  body: string,
  tags: string[],
  opts: Partial<ShowreelFeatureSlide> & {
    desktopSrc: string;
    durationMs: number;
  },
): ShowreelFeatureSlide => {
  const isCustomize = opts.desktopSrc.includes("mode=customize");
  const isProduct = opts.desktopSrc.includes("mode=product");

  return {
    id,
    kind: "feature",
    kicker,
    title,
    body,
    tags,
    durationMs: opts.durationMs,
    desktopSrc: opts.desktopSrc,
    mobileSrc: opts.mobileSrc ?? SITE_MOBILE,
    scroll: opts.scroll ?? false,
    scrollDepth: opts.scrollDepth ?? 0.18,
    scrollMs: opts.scrollMs ?? 3800,
    desktopOnly: isCustomize || isProduct || opts.desktopOnly,
    customizeScript: opts.customizeScript,
    productScene: opts.productScene,
    requiresAiReview: opts.requiresAiReview,
    scrollDelayMs: opts.scrollDelayMs,
    scrollTarget: opts.scrollTarget,
    scrollHeroFirst: opts.scrollHeroFirst,
    scrollHeroPhaseRatio: opts.scrollHeroPhaseRatio,
  };
};

/** ~2 min dental product reel for LinkedIn screen recording. */
export const SHOWREEL_SLIDES: ShowreelSlide[] = [
  {
    id: "intro",
    kind: "copy",
    durationMs: 5000,
    kicker: "Dental Lounge",
    title: "One connected clinic",
    body: "From first WhatsApp message to treatment plan — with human review at every AI step.",
    tags: ["One connected clinic.", "From first message to treatment plan."],
  },
  FEATURE(
    "site",
    "Public site",
    "Your clinic online",
    "Website with booking, services, and bilingual care.",
    ["Website", "Booking", "Bilingual"],
    {
      durationMs: 9000,
      desktopSrc: "/showreel/demo?mode=site",
      mobileSrc: SITE_MOBILE,
      desktopOnly: true,
      scroll: true,
      scrollDepth: 1,
      scrollHeroFirst: true,
      scrollHeroPhaseRatio: 0.4,
      scrollMs: 7000,
      scrollDelayMs: 400,
    },
  ),
  FEATURE(
    "site-to-chat",
    "Website booking",
    "From site to chat",
    "Customer books on the site, replies from WhatsApp — photos, voice notes, and PDFs all land in the same thread.",
    ["Book", "WhatsApp page", "Reply"],
    {
      // 33.5s: room for the reply to type itself out, then browse a few threads.
      durationMs: 33500,
      desktopSrc: PRODUCT("site-to-chat"),
      productScene: "site-to-chat",
    },
  ),
  FEATURE(
    "ai-booking",
    "AI front desk",
    "Book with AI",
    "Extracts patient, service, and slot — then waits for review.",
    ["Patient", "Slot", "Review"],
    {
      // 23.5s: room for the staff follow-up (typed + AI ack) after booking.
      durationMs: 23500,
      desktopSrc: PRODUCT("ai-booking"),
      productScene: "ai-booking",
      requiresAiReview: true,
    },
  ),
  FEATURE(
    "whatsapp",
    "WhatsApp",
    "Live front desk",
    "Workspace chart, offer slots, confirm Tue 10:30, send a voice note, then close the chat.",
    ["Workspace", "Slots", "Voice"],
    {
      durationMs: 22500,
      desktopSrc: PRODUCT("whatsapp"),
      productScene: "whatsapp",
    },
  ),
  FEATURE(
    "clinical-ai",
    "Clinical AI",
    "Describe the case",
    "Write a clinical note, attach imaging, confirm the proposal, then open Details.",
    ["Note", "Upload", "Details"],
    {
      // 22s: room for the note to type itself out before Send fires.
      durationMs: 22000,
      desktopSrc: PRODUCT("clinical-ai"),
      productScene: "clinical-ai",
      requiresAiReview: true,
    },
  ),
  FEATURE(
    "smart-ux",
    "Smart UX",
    "Search and book",
    "⌘K AI search jumps to Reservations, then book straight from the calendar.",
    ["⌘K", "Calendar", "Book"],
    {
      // 13.5s: the booking beat now ends at 11.8s, so the old 20s left the
      // slide sitting on a finished form for six seconds.
      durationMs: 13500,
      desktopSrc: PRODUCT("smart-ux"),
      productScene: "smart-ux",
    },
  ),
  FEATURE(
    "dashboard",
    "Operations",
    "Today at a glance",
    "Visits, unread chats, pending queue, and booking trend on one canvas.",
    ["KPI", "Schedule", "Trend"],
    {
      // 18.5s: the widget-edit beat now shows the added card where it lands
      // and a real carried drag (grab -> hover right -> drop left).
      durationMs: 18500,
      desktopSrc: PRODUCT("dashboard"),
      productScene: "dashboard",
    },
  ),
  FEATURE(
    "customize",
    "Customize",
    "Edit and preview",
    "Live-edit the hero, then preview mobile and desktop — English stays on.",
    ["Edit", "Preview", "Devices"],
    {
      durationMs: 16000,
      desktopSrc: "/showreel/demo?mode=customize&section=hero",
      customizeScript: "translate-all",
    },
  ),
  {
    id: "outro",
    kind: "outro",
    durationMs: 5000,
    kicker: "Designed and developed by",
    title: "Mohab Elbasiry",
    body: "What's next!",
  },
];
