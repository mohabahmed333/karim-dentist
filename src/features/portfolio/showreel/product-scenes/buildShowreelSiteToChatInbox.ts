import type { AdminDemoInbox } from "@/features/admin/lib/adminDemoInbox";
import type { SupportMessage } from "@/features/admin/components/support/supportDummyData";
import { buildShowreelDemoInbox } from "./buildShowreelDemoInbox";
import { DEMO_CONV } from "./fixtures/demoIds";
import { SITE_TO_CHAT_FIXTURE } from "./fixtures/siteToChatFixtures";

function websiteInbound(): SupportMessage {
  const fx = SITE_TO_CHAT_FIXTURE;
  return {
    id: "msg-site-to-chat-inbound",
    author: "customer",
    authorName: fx.patientName,
    body: fx.inboundBody,
    time: "now",
    status: "received",
    messageType: "text",
  };
}

/**
 * Demo inbox: Sara's website-booking inbound sits unread at her thread end,
 * and another thread starts open — the script's click on Sara has to actually
 * switch threads (and clear her badge) instead of re-opening what's already up.
 */
export function buildShowreelSiteToChatInbox(): AdminDemoInbox {
  const base = buildShowreelDemoInbox(SITE_TO_CHAT_FIXTURE.conversationId);
  const id = SITE_TO_CHAT_FIXTURE.conversationId;
  const prior = base.messagesById[id] ?? [];
  const inbound = websiteInbound();
  const withoutDup = prior.filter((m) => m.id !== inbound.id);

  return {
    ...base,
    conversations: base.conversations.map((c) =>
      c.id === id
        ? {
            ...c,
            preview: SITE_TO_CHAT_FIXTURE.inboundBody,
            unread: "1",
            timestamp: "now",
          }
        : c,
    ),
    messagesById: {
      ...base.messagesById,
      [id]: [...withoutDup, inbound],
    },
    forcedSelectedId: DEMO_CONV.omar,
  };
}
