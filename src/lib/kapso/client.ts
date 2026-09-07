import { WhatsAppClient } from "@kapso/whatsapp-cloud-api";

export function getKapsoConfig() {
  const apiKey = process.env.KAPSO_API_KEY;
  const phoneNumberId = process.env.KAPSO_PHONE_NUMBER_ID;
  const webhookSecret = process.env.KAPSO_WEBHOOK_SECRET;
  const baseHost = process.env.KAPSO_API_BASE_URL ?? "https://api.kapso.ai";
  if (!apiKey || !phoneNumberId) {
    throw new Error("Missing KAPSO_API_KEY or KAPSO_PHONE_NUMBER_ID");
  }
  return {
    apiKey,
    phoneNumberId,
    webhookSecret: webhookSecret ?? "",
    baseUrl: `${baseHost.replace(/\/$/, "")}/meta/whatsapp`,
  };
}

export function createKapsoClient() {
  const { apiKey, baseUrl } = getKapsoConfig();
  return new WhatsAppClient({
    baseUrl,
    kapsoApiKey: apiKey,
  });
}
