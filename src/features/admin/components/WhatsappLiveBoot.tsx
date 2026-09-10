"use client";

import { useEffect } from "react";
import { subscribeWhatsappLive } from "@/features/admin/lib/whatsappLiveClient";

/** Keep the WhatsApp realtime socket up on every admin page. */
export function WhatsappLiveBoot() {
  useEffect(() => subscribeWhatsappLive(() => {}), []);
  return null;
}
