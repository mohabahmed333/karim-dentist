import type { WhatsappCannedReply } from "@/services/whatsapp/cannedReplies";

export class QuickReplyApiError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.code = code;
  }
}

const JSON_HEADERS = { "Content-Type": "application/json" };

async function readReply(res: Response): Promise<WhatsappCannedReply> {
  const data = (await res.json().catch(() => null)) as {
    reply?: WhatsappCannedReply;
    error?: string;
    code?: string;
  } | null;
  if (!res.ok || !data?.reply) {
    throw new QuickReplyApiError(data?.error ?? "Request failed", data?.code);
  }
  return data.reply;
}

export async function createQuickReply(input: Record<string, unknown>) {
  const res = await fetch("/api/v1/whatsapp/canned-replies", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(input),
  });
  return readReply(res);
}

export async function updateQuickReply(id: string, input: Record<string, unknown>) {
  const res = await fetch(`/api/v1/whatsapp/canned-replies/${id}`, {
    method: "PATCH",
    headers: JSON_HEADERS,
    body: JSON.stringify(input),
  });
  return readReply(res);
}

export async function deleteQuickReply(id: string): Promise<void> {
  const res = await fetch(`/api/v1/whatsapp/canned-replies?id=${id}`, { method: "DELETE" });
  if (!res.ok) throw new QuickReplyApiError("Delete failed");
}
