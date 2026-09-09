export type ShowreelCursorStep = {
  id: string;
  at: number;
  selector?: string;
  scrollSelector?: string;
  click?: boolean;
  waitForSelector?: string;
  /** Press Escape (e.g. close quick-book dialog). */
  escape?: boolean;
  /** Dispatched on window when the step runs. If the step also has a
      `selector`, the dispatch fires on press — after the cursor has visibly
      arrived — instead of at step start, so the UI change reads as caused
      rather than teleported. */
  dispatch?: { name: string; detail?: unknown };
  /** Re-fires `dispatch` with a growing text prefix over this many ms, so a
      plain setState(text) handler renders as visible typing. Requires
      `dispatch.detail.text` to be a string. */
  typeMs?: number;
  /** While this step is a pending waitForSelector, drift the cursor toward
      this selector instead of sitting still. */
  anticipate?: string;
  /** Caption text that starts here and holds until the next step with a
      `beat`. Steps without one inherit the current caption. */
  beat?: string;
  /** Scroll the CONTENTS of `selector` to `top` (not scrollIntoView — the
      element is already on screen; this scrolls what's inside it, e.g. a
      live-preview panel). The cursor rides along via aim(). */
  scrollWithin?: { selector: string; top: number };
  /** A "this just succeeded" story beat: briefly ring-pulses the element
      matching this selector shortly after the step's own action lands. CSS
      only (.showreel-highlight-pulse) — no component render logic touched. */
  highlight?: string;
};

/** Deterministic operations beat for the real dashboard showreel. */
export const SHOWREEL_DASHBOARD_CURSOR_STEPS: ShowreelCursorStep[] = [
  {
    id: "scroll-schedule",
    at: 600,
    scrollSelector: '[data-dash-widget-id="daySchedule"]',
    beat: "Today's schedule at a glance",
  },
  {
    id: "scroll-charts",
    at: 2000,
    scrollSelector: '[data-dash-widget-id="chartVisitsWeek"]',
    beat: "Visits trending at a glance",
  },
  {
    id: "hold-charts",
    at: 5000,
    selector: '[data-dash-widget-id="chartVisitsWeek"]',
  },
  {
    id: "scroll-messages",
    at: 7000,
    scrollSelector: '[data-dash-widget-id="messages"]',
    beat: "Unread patient messages",
  },
  {
    id: "click-customize",
    at: 8500,
    selector: '[data-showreel-action="dashboard-customize"]',
    click: true,
    beat: "Rearrange the dashboard your way",
  },
  {
    id: "wait-edit-mode",
    at: 9300,
    waitForSelector: '[data-dash-widget-drag-surface]',
  },
  {
    id: "click-add",
    at: 10200,
    selector: '[data-showreel-action="dashboard-add-widget"]',
    click: true,
    beat: "Add a widget in one click",
  },
  {
    id: "wait-catalog",
    at: 11000,
    waitForSelector: '[data-dash-widget-catalog-item="kpiUnreadChats"]',
  },
  {
    id: "pick-widget",
    at: 11800,
    selector: '[data-dash-widget-catalog-item="kpiUnreadChats"]',
    click: true,
    highlight: '[data-dash-widget-id="kpiUnreadChats"]',
  },
  {
    id: "hold-added",
    at: 13300,
    selector: '[data-dash-widget-id="kpiUnreadChats"]',
  },
  {
    id: "swap-widgets",
    at: 14800,
    selector: '[data-dash-widget-id="kpiPending"]',
    beat: "Or drag to reorder",
    highlight: '[data-dash-widget-id="kpiTodayVisits"]',
    dispatch: {
      name: "admin-dashboard-layout-action",
      detail: {
        type: "move",
        fromId: "kpiPending",
        targetId: "kpiTodayVisits",
        edge: "left",
      },
    },
  },
  {
    id: "hold-swapped",
    at: 16800,
    selector: '[data-dash-widget-id="kpiTodayVisits"]',
  },
];

export const SHOWREEL_SMART_UX_CURSOR_STEPS: ShowreelCursorStep[] = [
  {
    id: "open-command",
    at: 500,
    selector: '[data-showreel-action="command-palette-open"]',
    click: true,
    beat: "Reach anything from the keyboard",
  },
  {
    id: "type-query",
    at: 1400,
    selector: '[data-showreel-action="command-palette-input"]',
    dispatch: {
      name: "showreel-command-palette",
      detail: {
        type: "query",
        query: "reservations page",
      },
    },
  },
  {
    id: "demo-hits",
    at: 2600,
    dispatch: {
      name: "showreel-command-palette",
      detail: { type: "seed-demo" },
    },
  },
  {
    id: "select-page",
    at: 3800,
    selector: '[data-showreel-hit="hit-page"]',
    click: true,
    beat: "Jump straight to reservations",
  },
  {
    id: "wait-page",
    at: 4800,
    waitForSelector: '[data-showreel-action="demo-page-reservations"]',
  },
  {
    id: "open-fab",
    at: 6000,
    selector: '[data-showreel-action="chat-fab"]',
    click: true,
    beat: "Chat follows you across the app",
  },
  {
    id: "wait-chooser",
    at: 7000,
    waitForSelector: '[data-showreel-action="bubble-whatsapp"]',
  },
  {
    id: "open-whatsapp",
    at: 7600,
    selector: '[data-showreel-action="bubble-whatsapp"]',
    click: true,
  },
  {
    id: "wait-composer",
    at: 8800,
    waitForSelector:
      '[data-showreel-action="whatsapp-panel"]:not([aria-hidden="true"]) [data-showreel-action="whatsapp-composer"]',
  },
  {
    id: "compose-message",
    at: 9800,
    selector: '[data-showreel-action="whatsapp-composer"]',
    click: true,
    typeMs: 900,
    beat: "Reply to the patient in place",
    dispatch: {
      name: "showreel-whatsapp",
      detail: {
        type: "compose-message",
        text: "Tue 10:30 works — see you then!",
      },
    },
  },
  {
    id: "send-message",
    at: 12020,
    selector: '[data-showreel-action="whatsapp-send"]',
    click: true,
    highlight: '[data-showreel-action="whatsapp-panel"]',
    dispatch: {
      name: "showreel-whatsapp",
      detail: {
        type: "send-message",
        text: "Tue 10:30 works — see you then!",
      },
    },
  },
  {
    id: "hold-sent",
    at: 13620,
    waitForSelector: '[data-showreel-action="whatsapp-composer"]',
  },
  {
    id: "toggle-dock",
    at: 15020,
    selector: '[data-showreel-action="chat-layout-toggle"]',
    click: true,
    beat: "Dock it, or get it out of the way",
  },
  {
    id: "collapse-dock",
    at: 17020,
    selector: '[data-showreel-action="chat-collapse"]',
    click: true,
  },
  {
    id: "hold-collapsed",
    at: 18820,
    selector: '[data-showreel-action="chat-fab"], [data-showreel-action="chat-collapse"]',
  },
];

export const SHOWREEL_CLINICAL_CURSOR_STEPS: ShowreelCursorStep[] = [
  {
    id: "focus-chart",
    at: 600,
    selector: '[data-showreel-action="clinical-chart"]',
    beat: "Chart the tooth",
  },
  {
    id: "select-tooth",
    at: 1800,
    selector: '[data-showreel-action="clinical-chart"]',
    dispatch: {
      name: "showreel-clinical",
      detail: { type: "select-tooth", fdi: "16" },
    },
  },
  {
    id: "wait-composer",
    at: 3000,
    waitForSelector: '[data-showreel-action="clinical-composer"]',
  },
  {
    id: "compose-note",
    at: 4000,
    selector: '[data-showreel-action="clinical-composer"]',
    click: true,
    typeMs: 2200,
    beat: "Dictate the clinical note",
    dispatch: {
      name: "showreel-clinical",
      detail: {
        type: "compose-note",
        text: "Pain on biting 4 days; cold sensitivity >10s. No swelling. Suspect deep occlusal caries on #16.",
      },
    },
  },
  {
    id: "attach-images",
    at: 7700,
    beat: "Attach the X-rays",
    selector: '[data-showreel-action="clinical-attach"]',
    dispatch: {
      name: "showreel-clinical",
      detail: { type: "attach-demo-images" },
    },
  },
  {
    id: "wait-uploads",
    at: 8900,
    waitForSelector: '[data-showreel-action="clinical-pending-uploads"]',
  },
  {
    id: "send-note",
    at: 10400,
    selector: '[data-showreel-action="clinical-send"]',
    click: true,
    dispatch: {
      name: "showreel-clinical",
      detail: { type: "send-note" },
    },
  },
  {
    id: "wait-review",
    at: 12400,
    waitForSelector: '[data-showreel-action="clinical-ai-summary"]',
    beat: "AI drafts the treatment plan",
  },
  {
    id: "scroll-summary",
    at: 13700,
    scrollSelector: '[data-showreel-action="clinical-ai-summary"]',
  },
  {
    id: "review-apply",
    at: 15700,
    selector: '[data-showreel-action="clinical-review-apply"]',
    click: true,
    highlight: '[data-showreel-action="clinical-review-apply"]',
    beat: "Clinician reviews before anything is saved",
  },
  {
    id: "open-details",
    at: 17400,
    selector: '[data-showreel-action="clinical-tab-details"]',
    click: true,
    dispatch: {
      name: "showreel-clinical",
      detail: { type: "tab", tab: "details" },
    },
  },
  {
    id: "hold-details",
    at: 19100,
    waitForSelector: '[data-showreel-action="clinical-details"]',
  },
];

export const SHOWREEL_WHATSAPP_CURSOR_STEPS: ShowreelCursorStep[] = [
  {
    id: "wait-whatsapp",
    at: 500,
    waitForSelector:
      '[data-showreel-action="whatsapp-panel"]:not([aria-hidden="true"])',
    beat: "Patient messages the clinic",
  },
  {
    id: "wait-thread",
    at: 1400,
    waitForSelector: '[data-showreel-action="whatsapp-workspace"]',
  },
  {
    id: "open-workspace",
    at: 2400,
    selector: '[data-showreel-action="whatsapp-workspace"]',
    click: true,
    beat: "Open their chart beside the chat",
    dispatch: {
      name: "showreel-whatsapp",
      detail: { type: "workspace" },
    },
  },
  {
    id: "wait-workspace",
    at: 3800,
    waitForSelector: '[data-showreel-action="clinic-workspace-page"]',
  },
  {
    id: "open-quick-replies",
    at: 5000,
    selector: '[data-showreel-action="whatsapp-quick-replies"]',
    beat: "Send open slots in one tap",
    dispatch: {
      name: "showreel-whatsapp",
      detail: { type: "quick-replies" },
    },
  },
  {
    id: "wait-quick-replies",
    at: 6200,
    waitForSelector: '[data-showreel-action="whatsapp-quick-replies-open"]',
  },
  {
    id: "send-slots",
    at: 7800,
    selector: '[data-showreel-action="whatsapp-send"]',
    click: true,
  },
  {
    id: "open-book",
    at: 9800,
    selector: '[data-showreel-action="whatsapp-book"]',
    click: true,
    beat: "Book it from the conversation",
    dispatch: {
      name: "showreel-whatsapp",
      detail: { type: "book" },
    },
  },
  {
    id: "wait-book-card",
    at: 11200,
    waitForSelector: '[data-showreel-action="whatsapp-book-card"]',
  },
  {
    id: "confirm-book",
    at: 12800,
    selector: '[data-showreel-action="whatsapp-book-confirm"]',
    click: true,
    dispatch: {
      name: "showreel-whatsapp",
      detail: { type: "confirm-book" },
    },
  },
  {
    id: "hold-confirmed",
    at: 14800,
    selector: '[data-showreel-action="whatsapp-panel"]',
  },
  {
    id: "start-voice",
    at: 15800,
    selector: '[data-showreel-action="whatsapp-voice"]',
    click: true,
    beat: "Voice note, sent back",
    dispatch: {
      name: "showreel-whatsapp",
      detail: { type: "voice-start" },
    },
  },
  {
    id: "hold-voice",
    at: 17200,
    waitForSelector: '[data-showreel-action="whatsapp-voice-recorder"]',
  },
  {
    id: "send-voice",
    at: 18800,
    selector: '[data-showreel-action="whatsapp-voice-send"]',
    click: true,
    dispatch: {
      name: "showreel-whatsapp",
      detail: { type: "voice-send" },
    },
  },
  {
    id: "close-chat",
    at: 20500,
    selector: '[data-showreel-action="chat-close"]',
    click: true,
    beat: "Back to the queue",
  },
  {
    id: "hold-closed",
    at: 22000,
    selector: '[data-showreel-action="chat-fab"]',
  },
];

export const SHOWREEL_AI_BOOKING_CURSOR_STEPS: ShowreelCursorStep[] = [
  {
    id: "wait-assist",
    at: 500,
    waitForSelector:
      '[data-showreel-action="assist-panel"]:not([aria-hidden="true"])',
    beat: "Patient books by chat",
  },
  {
    id: "focus-composer",
    at: 1600,
    selector: '[data-showreel-action="assist-composer"]',
    click: true,
  },
  {
    id: "review-card",
    at: 8500,
    scrollSelector: '[data-showreel-action="assist-review"]',
    beat: "AI reads the request and proposes a slot",
  },
  {
    id: "confirm-review",
    at: 12500,
    selector: '[data-showreel-action="clinical-review-apply"]',
    click: true,
    highlight: '[data-showreel-action="clinical-review-apply"]',
    beat: "Staff confirms — nothing auto-books",
  },
  {
    id: "hold-created",
    at: 15500,
    selector: '[data-showreel-action="assist-panel"]',
  },
  {
    id: "type-followup",
    at: 16200,
    selector: '[data-showreel-action="assist-composer"]',
    click: true,
    typeMs: 1600,
    beat: "Staff follows up without leaving the chat",
    dispatch: {
      name: "showreel-assist",
      detail: {
        type: "compose-followup",
        text: "Please confirm with her by WhatsApp too",
      },
    },
  },
  {
    id: "send-followup",
    at: 19300,
    dispatch: { name: "showreel-assist", detail: { type: "send-followup" } },
  },
  {
    id: "hold-followup",
    at: 21500,
    selector: '[data-showreel-action="assist-panel"]',
  },
];

export function showreelCursorStepIds(
  steps: ShowreelCursorStep[] = SHOWREEL_DASHBOARD_CURSOR_STEPS,
): string[] {
  return steps.map((s) => s.id);
}

export function resolveShowreelCursorTarget(
  root: ParentNode,
  selector: string,
): Element | null {
  return root.querySelector(selector);
}
