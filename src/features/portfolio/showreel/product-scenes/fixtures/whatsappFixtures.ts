import { WHATSAPP_FIXTURE_CONVERSATIONS } from "./whatsappConversations";
import {
  WHATSAPP_FIXTURE_MESSAGES,
  type FixtureMessage,
} from "./whatsappMessagesPartA";
import { WHATSAPP_FIXTURE_MESSAGES_B } from "./whatsappMessagesPartB";
import { DEMO_CONV } from "./demoIds";

export { DEMO_CONV, WHATSAPP_FIXTURE_CONVERSATIONS };
export type { FixtureMessage } from "./whatsappMessagesPartA";

export const WHATSAPP_ALL_MESSAGES: Record<string, FixtureMessage[]> = {
  ...WHATSAPP_FIXTURE_MESSAGES,
  ...WHATSAPP_FIXTURE_MESSAGES_B,
};

/** Scripted inbound → reply → delivered timeline for the WhatsApp showreel slide. */
export const WHATSAPP_SHOWREEL_SCRIPT = {
  conversationId: DEMO_CONV.sara,
  inboundPreview: "Can I book teeth whitening this week?",
  agentReply: "Yes — I'll check Tue 10:30 and confirm in a moment.",
  deliveredLabel: "Delivered",
} as const;

export function countFixtureMessages(): number {
  return Object.values(WHATSAPP_ALL_MESSAGES).reduce(
    (sum, thread) => sum + thread.length,
    0,
  );
}

export function fixtureMessageTypes(): Set<string> {
  const types = new Set<string>();
  for (const thread of Object.values(WHATSAPP_ALL_MESSAGES)) {
    for (const msg of thread) {
      if (msg.messageType) types.add(msg.messageType);
    }
  }
  return types;
}
