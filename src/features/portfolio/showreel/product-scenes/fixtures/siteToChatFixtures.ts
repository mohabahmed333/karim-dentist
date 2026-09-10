import { DEMO_CONV } from "./demoIds";

/** Shared identity for public booking → dashboard → WhatsApp confirm. */
export const SITE_TO_CHAT_FIXTURE = {
  conversationId: DEMO_CONV.sara,
  patientName: "Sara Hassan",
  phone: "+201111000001",
  email: "sara@example.com",
  serviceId: "svc-whitening",
  serviceLabel: "Teeth whitening",
  slotLabel: "Tue 10:30",
  slotId: "slot-site-tue-1030",
  reservationId: "res-sara",
  inboundBody:
    "I just booked Teeth whitening for Tue 10:30 on the website.",
  confirmBody:
    "You're confirmed for Tue 10:30 — Teeth whitening. See you then!",
} as const;
