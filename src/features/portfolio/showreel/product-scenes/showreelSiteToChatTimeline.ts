import type { ShowreelCursorStep } from "./showreelCursorTimeline";
import { SITE_TO_CHAT_FIXTURE } from "./fixtures/siteToChatFixtures";
import { DEMO_CONV } from "./fixtures/demoIds";

/** Public book → dashboard reservation → Front desk reply (~24s). */
export const SHOWREEL_SITE_TO_CHAT_CURSOR_STEPS: ShowreelCursorStep[] = [
  {
    id: "scroll-booking",
    at: 400,
    scrollSelector: '[data-showreel-action="booking-form"]',
    beat: "A patient books directly from the site",
  },
  {
    id: "fill-name",
    at: 1400,
    selector: '[data-showreel-action="booking-name"]',
    click: true,
    dispatch: {
      name: "showreel-site-to-chat",
      detail: { type: "fill", field: "name" },
    },
  },
  {
    id: "fill-phone",
    at: 2400,
    selector: '[data-showreel-action="booking-phone"]',
    click: true,
    dispatch: {
      name: "showreel-site-to-chat",
      detail: { type: "fill", field: "phone" },
    },
  },
  {
    id: "fill-service",
    at: 3400,
    selector: '[data-showreel-action="booking-service"]',
    dispatch: {
      name: "showreel-site-to-chat",
      detail: { type: "fill", field: "service" },
    },
  },
  {
    // booking-date has a real onClick that sets the selected date. Slot
    // buttons only render once a date is selected, so this has to be a
    // real click, not just a wait — pick-slot's selector otherwise never
    // matches anything and silently times out.
    id: "pick-date",
    at: 4500,
    selector: '[data-showreel-action="booking-date"]:not([aria-disabled="true"])',
    click: true,
  },
  {
    // booking-slot has a real onClick that selects the slot, so a genuine
    // click replaces the synthetic fill entirely.
    id: "pick-slot",
    at: 6000,
    selector: '[data-showreel-action="booking-slot"]:not([aria-disabled="true"])',
    click: true,
  },
  {
    id: "scroll-submit",
    at: 7000,
    scrollSelector: '[data-showreel-action="booking-submit"]',
    beat: "Confirming the appointment",
  },
  {
    id: "submit-booking",
    at: 7800,
    selector: '[data-showreel-action="booking-submit"]',
    click: true,
    dispatch: {
      name: "showreel-site-to-chat",
      detail: { type: "submit" },
    },
  },
  {
    id: "wait-success",
    at: 8800,
    waitForSelector: '[data-showreel-action="booking-success"]',
    highlight: '[data-showreel-action="booking-success"]',
  },
  {
    id: "hold-reservation",
    at: 11100,
    selector: `[data-showreel-action="schedule-appointment"][data-reservation-id="${SITE_TO_CHAT_FIXTURE.reservationId}"]`,
    beat: "It lands on the clinic's calendar instantly",
  },
  {
    id: "open-frontdesk",
    at: 12800,
    selector: '[data-showreel-action="nav-front-desk"]',
    click: true,
    beat: "Jump straight to the front desk",
    dispatch: {
      name: "showreel-navigate",
      detail: {
        href: "/admin/support",
        title: "Front desk",
        id: "support",
        kind: "page",
      },
    },
  },
  {
    id: "wait-frontdesk",
    at: 14400,
    waitForSelector: '[data-showreel-action="whatsapp-page"]',
  },
  {
    id: "open-thread",
    at: 15800,
    selector: `[data-showreel-action="whatsapp-page"] [data-showreel-action="whatsapp-conversation"][data-conversation-id="${SITE_TO_CHAT_FIXTURE.conversationId}"]`,
    click: true,
  },
  {
    id: "wait-thread",
    at: 16800,
    waitForSelector:
      '[data-showreel-action="whatsapp-page"] [data-showreel-action="whatsapp-composer"]',
  },
  {
    id: "compose-reply",
    at: 17800,
    selector:
      '[data-showreel-action="whatsapp-page"] [data-showreel-action="whatsapp-composer"]',
    click: true,
    typeMs: 1600,
    beat: "Reply to the patient without leaving the thread",
    dispatch: {
      name: "showreel-whatsapp",
      detail: {
        type: "compose-message",
        text: SITE_TO_CHAT_FIXTURE.confirmBody,
      },
    },
  },
  {
    id: "send-reply",
    at: 20900,
    selector:
      '[data-showreel-action="whatsapp-page"] [data-showreel-action="whatsapp-send"]',
    click: true,
    highlight: '[data-showreel-action="whatsapp-page"]',
    dispatch: {
      name: "showreel-whatsapp",
      detail: {
        type: "send-message",
        text: SITE_TO_CHAT_FIXTURE.confirmBody,
      },
    },
  },
  {
    id: "hold-replied",
    at: 23400,
    selector: '[data-showreel-action="whatsapp-page"]',
  },
  {
    id: "open-nour",
    at: 24600,
    selector: `[data-showreel-action="whatsapp-page"] [data-showreel-action="whatsapp-conversation"][data-conversation-id="${DEMO_CONV.nour}"]`,
    click: true,
    beat: "Every message type lands in the same thread",
  },
  {
    id: "hold-nour",
    at: 25800,
    selector: '[data-showreel-action="whatsapp-page"] [data-message-id="nour-3"]',
  },
  {
    id: "open-youssef",
    at: 27000,
    selector: `[data-showreel-action="whatsapp-page"] [data-showreel-action="whatsapp-conversation"][data-conversation-id="${DEMO_CONV.youssef}"]`,
    click: true,
    beat: "Voice notes, too",
  },
  {
    id: "hold-youssef",
    at: 28200,
    selector: '[data-showreel-action="whatsapp-page"] [data-message-id="you-2"]',
  },
  {
    id: "open-mariam",
    at: 29400,
    selector: `[data-showreel-action="whatsapp-page"] [data-showreel-action="whatsapp-conversation"][data-conversation-id="${DEMO_CONV.mariam}"]`,
    click: true,
    beat: "Even PDFs and estimates",
  },
  {
    id: "hold-mariam",
    at: 30600,
    selector: '[data-showreel-action="whatsapp-page"] [data-message-id="mar-2"]',
  },
  {
    id: "hold-end",
    at: 31800,
    selector: '[data-showreel-action="whatsapp-page"]',
  },
];
