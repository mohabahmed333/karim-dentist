import type { ShowreelCursorStep } from "./showreelCursorTimeline";
import { SITE_TO_CHAT_FIXTURE } from "./fixtures/siteToChatFixtures";

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
    id: "wait-slots",
    at: 4500,
    waitForSelector: '[data-showreel-action="booking-date"]:not([aria-disabled="true"])',
  },
  {
    // booking-slot has a real onClick that selects the slot, so a genuine
    // click replaces the synthetic fill entirely.
    id: "pick-slot",
    at: 5400,
    selector: '[data-showreel-action="booking-slot"]:not([aria-disabled="true"])',
    click: true,
  },
  {
    id: "scroll-submit",
    at: 6400,
    scrollSelector: '[data-showreel-action="booking-submit"]',
    beat: "Confirming the appointment",
  },
  {
    id: "submit-booking",
    at: 7200,
    selector: '[data-showreel-action="booking-submit"]',
    click: true,
    dispatch: {
      name: "showreel-site-to-chat",
      detail: { type: "submit" },
    },
  },
  {
    id: "wait-success",
    at: 8200,
    waitForSelector: '[data-showreel-action="booking-success"]',
  },
  {
    id: "hold-reservation",
    at: 10500,
    selector: `[data-showreel-action="schedule-appointment"][data-reservation-id="${SITE_TO_CHAT_FIXTURE.reservationId}"]`,
    beat: "It lands on the clinic's calendar instantly",
  },
  {
    id: "open-frontdesk",
    at: 12200,
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
    at: 13800,
    waitForSelector: '[data-showreel-action="whatsapp-page"]',
  },
  {
    id: "open-thread",
    at: 15200,
    selector: `[data-showreel-action="whatsapp-page"] [data-showreel-action="whatsapp-conversation"][data-conversation-id="${SITE_TO_CHAT_FIXTURE.conversationId}"]`,
    click: true,
  },
  {
    id: "wait-thread",
    at: 16200,
    waitForSelector:
      '[data-showreel-action="whatsapp-page"] [data-showreel-action="whatsapp-composer"]',
  },
  {
    id: "compose-reply",
    at: 17200,
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
    at: 20300,
    selector:
      '[data-showreel-action="whatsapp-page"] [data-showreel-action="whatsapp-send"]',
    click: true,
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
    at: 22800,
    selector: '[data-showreel-action="whatsapp-page"]',
  },
];
