import { DEMO_CONV } from "./demoIds";

export type FixtureMessage = {
  id: string;
  author: "customer" | "agent";
  authorName: string;
  body: string;
  time: string;
  status?: "pending" | "received" | "sent" | "delivered" | "read" | "failed";
  messageType?: string;
  media?: { url: string; mime?: string; name?: string; size?: number }[];
  flow?: Record<string, unknown> | null;
  replyTo?: { wamid: string; authorName: string; body: string } | null;
};

const FD = "Front desk";

export const WHATSAPP_FIXTURE_MESSAGES: Record<string, FixtureMessage[]> = {
  [DEMO_CONV.sara]: [
    {
      id: "sara-1",
      author: "customer",
      authorName: "Sara Hassan",
      body: "Hi Dental Lounge — do you offer professional whitening?",
      time: "16:10",
      status: "received",
      messageType: "text",
    },
    {
      id: "sara-2",
      author: "agent",
      authorName: FD,
      body: "Welcome Sara! Yes — in-chair whitening and take-home kits.",
      time: "16:12",
      status: "read",
      messageType: "text",
    },
    {
      id: "sara-3",
      author: "customer",
      authorName: "Sara Hassan",
      body: "In-chair please. Any openings this week?",
      time: "16:20",
      status: "received",
      messageType: "text",
    },
    {
      id: "sara-4",
      author: "agent",
      authorName: FD,
      body: "We have Tue 10:30, Wed 14:00, Thu 11:00.",
      time: "16:22",
      status: "delivered",
      messageType: "text",
    },
    {
      id: "sara-5",
      author: "customer",
      authorName: "Sara Hassan",
      body: "Can I book teeth whitening this week?",
      time: "now",
      status: "received",
      messageType: "text",
    },
  ],
  [DEMO_CONV.omar]: [
    {
      id: "omar-1",
      author: "agent",
      authorName: FD,
      body: "Reminder: cleaning tomorrow at 09:00. Reply RESCHEDULE to change.",
      time: "09:00",
      status: "read",
      messageType: "text",
    },
    {
      id: "omar-2",
      author: "customer",
      authorName: "Omar Farid",
      body: "RESCHEDULE please — morning conflict",
      time: "10:05",
      status: "received",
      messageType: "text",
    },
    {
      id: "omar-3",
      author: "agent",
      authorName: FD,
      body: "Got it. Open slots: Tue 10:30 or Wed 16:00.",
      time: "10:10",
      status: "read",
      messageType: "text",
    },
    {
      id: "omar-4",
      author: "customer",
      authorName: "Omar Farid",
      body: "Tuesday 10:30 please",
      time: "10:40",
      status: "received",
      messageType: "text",
      replyTo: {
        wamid: "demo_wamid_omar_03",
        authorName: FD,
        body: "Got it. Open slots: Tue 10:30 or Wed 16:00.",
      },
    },
    {
      id: "omar-5",
      author: "agent",
      authorName: FD,
      body: "Thanks — Tuesday 10:30 works. Confirmed.",
      time: "10:45",
      status: "read",
      messageType: "text",
    },
  ],
};
