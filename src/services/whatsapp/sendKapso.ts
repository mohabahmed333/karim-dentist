import type { WhatsAppClient } from "@kapso/whatsapp-cloud-api";
import { fakeKapsoEnabled } from "@/lib/testing/e2eFakes";
import { buildTemplateSendPayload } from "@kapso/whatsapp-cloud-api";
import {
  CLINIC_LOCATION,
  clinicContactFromSettings,
  type ClinicContactInfo,
} from "@/lib/clinic/whatsappClinicContact";
import type {
  MessageFlowPayload,
  MessageMediaItem,
} from "./messageMedia";

export type SendKind =
  | "text"
  | "image"
  | "video"
  | "document"
  | "audio"
  | "location"
  | "contacts"
  | "interactive_buttons"
  | "interactive_cta"
  | "template";

export type KapsoSendResult = {
  wamid: string | null;
  messageType: string;
  body: string;
  preview: string;
  media: MessageMediaItem[];
  flow: MessageFlowPayload | null;
};

export type TemplateSendInput = {
  name: string;
  language: string;
  header?: { type: "text"; text: string; parameterName?: string }[];
  body?: { type: "text"; text: string; parameterName?: string }[];
};

function extractWamid(result: unknown): string | null {
  return (
    (result as { messages?: { id?: string }[] })?.messages?.[0]?.id ?? null
  );
}

export async function uploadMediaFile(
  client: WhatsAppClient,
  phoneNumberId: string,
  file: File | Blob,
  mime: string,
  fileName?: string,
): Promise<string> {
  const uploaded = await client.media.upload({
    phoneNumberId,
    type: mime,
    file,
    fileName,
  });
  return uploaded.id;
}

export async function sendKapsoPayload(input: {
  client: WhatsAppClient;
  phoneNumberId: string;
  to: string;
  kind: SendKind;
  text?: string;
  mediaId?: string;
  mime?: string;
  fileName?: string;
  buttons?: { id: string; title: string }[];
  ctaLabel?: string;
  ctaUrl?: string;
  clinic?: ClinicContactInfo;
  location?: {
    latitude: number;
    longitude: number;
    name: string;
    address: string;
  };
  contextMessageId?: string;
  template?: TemplateSendInput;
}): Promise<KapsoSendResult> {
  const { client, phoneNumberId, to, kind } = input;
  const text = input.text?.trim() ?? "";
  const base = { phoneNumberId, to };

  // E2E only: record the send shape without calling Meta. See e2eFakes.
  if (fakeKapsoEnabled()) {
    return {
      wamid: `wamid.fake.${Date.now()}`,
      messageType: kind === "template" ? "template" : kind,
      body: text,
      preview: text.slice(0, 240) || kind,
      media: [],
      flow: null,
    };
  }

  if (kind === "template" && input.template) {
    const tpl = input.template;
    const sendInput: Parameters<typeof buildTemplateSendPayload>[0] = {
      name: tpl.name,
      language: tpl.language,
    };
    if (tpl.header?.length === 1) {
      const h = tpl.header[0]!;
      sendInput.header = {
        type: "text",
        text: h.text,
        ...(h.parameterName ? { parameterName: h.parameterName } : {}),
      };
    } else if (tpl.header && tpl.header.length > 1) {
      throw new Error("Multi-parameter text headers are not supported");
    }
    if (tpl.body?.length) {
      sendInput.body = tpl.body.map((p) => ({
        type: "text" as const,
        text: p.text,
        ...(p.parameterName ? { parameterName: p.parameterName } : {}),
      }));
    }
    const built = buildTemplateSendPayload(sendInput);
    const result = await client.messages.sendTemplate({
      ...base,
      template: built as unknown as {
        name: string;
        language: { code: string; policy?: "deterministic" };
        components?: { type: string; [key: string]: unknown }[];
      },
    });
    const filled = [
      ...(tpl.header ?? []).map((p) => p.text),
      ...(tpl.body ?? []).map((p) => p.text),
    ]
      .filter(Boolean)
      .join(" · ");
    const preview = filled
      ? `${tpl.name}: ${filled}`.slice(0, 240)
      : `Template: ${tpl.name}`;
    return {
      wamid: extractWamid(result),
      messageType: "template",
      body: preview,
      preview,
      media: [],
      flow: {
        kind: "template",
        title: tpl.name,
        subtitle: tpl.language,
      },
    };
  }

  if (kind === "text") {
    const result = await client.messages.sendText({
      ...base,
      body: text,
      contextMessageId: input.contextMessageId,
    });
    return {
      wamid: extractWamid(result),
      messageType: "text",
      body: text,
      preview: text.slice(0, 240),
      media: [],
      flow: null,
    };
  }

  if (kind === "image" && input.mediaId) {
    const result = await client.messages.sendImage({
      ...base,
      image: { id: input.mediaId, caption: text || undefined },
    });
    return {
      wamid: extractWamid(result),
      messageType: "image",
      body: text,
      preview: text || "Photo",
      media: [{ url: "", mime: input.mime, name: input.fileName }],
      flow: null,
    };
  }

  if (kind === "video" && input.mediaId) {
    const result = await client.messages.sendVideo({
      ...base,
      video: { id: input.mediaId, caption: text || undefined },
    });
    return {
      wamid: extractWamid(result),
      messageType: "video",
      body: text,
      preview: text || "Video",
      media: [{ url: "", mime: input.mime, name: input.fileName }],
      flow: null,
    };
  }

  if (kind === "document" && input.mediaId) {
    const result = await client.messages.sendDocument({
      ...base,
      document: {
        id: input.mediaId,
        caption: text || undefined,
        filename: input.fileName,
      },
    });
    return {
      wamid: extractWamid(result),
      messageType: "document",
      body: text,
      preview: input.fileName || text || "Document",
      media: [{ url: "", mime: input.mime, name: input.fileName }],
      flow: null,
    };
  }

  if (kind === "audio" && input.mediaId) {
    const result = await client.messages.sendAudio({
      ...base,
      audio: { id: input.mediaId, voice: true },
    });
    return {
      wamid: extractWamid(result),
      messageType: "audio",
      body: "",
      preview: "Voice message",
      media: [{ url: "", mime: input.mime ?? "audio/ogg", name: "Voice note" }],
      flow: null,
    };
  }

  if (kind === "location") {
    const loc = input.location ?? {
      latitude: CLINIC_LOCATION.latitude,
      longitude: CLINIC_LOCATION.longitude,
      name: input.clinic?.name ?? CLINIC_LOCATION.name,
      address: input.clinic?.address ?? CLINIC_LOCATION.address,
    };
    const result = await client.messages.sendLocation({
      ...base,
      location: {
        latitude: loc.latitude,
        longitude: loc.longitude,
        name: loc.name,
        address: loc.address,
      },
    });
    return {
      wamid: extractWamid(result),
      messageType: "location",
      body: loc.address,
      preview: "Location",
      media: [],
      flow: {
        kind: "location",
        title: loc.name,
        address: loc.address,
        latitude: loc.latitude,
        longitude: loc.longitude,
      },
    };
  }

  if (kind === "contacts") {
    const clinic =
      input.clinic ?? clinicContactFromSettings(null);
    const result = await client.messages.sendContacts({
      ...base,
      contacts: [
        {
          name: { formattedName: clinic.name, firstName: clinic.name },
          phones: [{ phone: clinic.phone, type: "WORK" }],
          addresses: [{ street: clinic.address, type: "WORK" }],
          org: { company: clinic.name },
        },
      ],
    });
    return {
      wamid: extractWamid(result),
      messageType: "contacts",
      body: `${clinic.name} · ${clinic.phone}`,
      preview: "Contact",
      media: [],
      flow: {
        kind: "contacts",
        title: clinic.name,
        phone: clinic.phone,
        address: clinic.address,
      },
    };
  }

  if (kind === "interactive_buttons" && input.buttons?.length) {
    const result = await client.messages.sendInteractiveButtons({
      ...base,
      bodyText: text || "Please choose an option:",
      buttons: input.buttons.slice(0, 3),
    });
    return {
      wamid: extractWamid(result),
      messageType: "interactive",
      body: text || "Please choose an option:",
      preview: text || "Form",
      media: [],
      flow: {
        kind: "buttons",
        title: "Quick replies",
        subtitle: text,
        buttons: input.buttons.slice(0, 3),
      },
    };
  }

  if (kind === "interactive_cta" && input.ctaUrl && input.ctaLabel) {
    const result = await client.messages.sendInteractiveCtaUrl({
      ...base,
      bodyText: text || "Tap below for more details:",
      parameters: {
        displayText: input.ctaLabel,
        url: input.ctaUrl,
      },
    });
    return {
      wamid: extractWamid(result),
      messageType: "interactive",
      body: text || "Tap below for more details:",
      preview: text || "Form",
      media: [],
      flow: {
        kind: "cta",
        title: input.ctaLabel,
        subtitle: text,
        ctaLabel: input.ctaLabel,
        ctaUrl: input.ctaUrl,
        cta: input.ctaLabel,
      },
    };
  }

  throw new Error(`Unsupported send kind: ${kind}`);
}
