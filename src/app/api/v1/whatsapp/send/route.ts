import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/api/requireAdmin";
import { loadAiSettings, markHumanHandoff } from "@/services/whatsapp_ai/store";
import { createKapsoClient, getKapsoConfig } from "@/lib/kapso/client";
import {
  clinicContactFromSettings,
} from "@/lib/clinic/whatsappClinicContact";
import {
  getConversation,
  insertOutboundMessage,
} from "@/services/whatsapp";
import { isWhatsappSessionOpen, latestInboundAt } from "@/services/whatsapp/sessionWindow";
import { buildTemplateSendParts } from "@/services/whatsapp/templateFields";
import {
  sendKapsoPayload,
  uploadMediaFile,
  type SendKind,
} from "@/services/whatsapp/sendKapso";
import { uploadWhatsappMediaFile } from "@/services/whatsapp/mediaStorage";
import { checkInteractiveButtons } from "@/services/whatsapp/interactiveButtons";

export const runtime = "nodejs";

const jsonSchema = z
  .object({
    conversationId: z.string().uuid(),
    kind: z
      .enum([
        "text",
        "location",
        "contacts",
        "interactive_buttons",
        "interactive_cta",
        "template",
      ])
      .optional(),
    text: z.string().max(4000).optional(),
    buttons: z
      .array(
        z.object({
          id: z.string().min(1).max(256),
          title: z.string().min(1).max(20),
        }),
      )
      .max(3)
      .optional(),
    ctaLabel: z.string().trim().min(1).max(20).optional(),
    ctaUrl: z.string().url().optional(),
    location: z
      .object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        name: z.string().trim().min(1).max(100),
        address: z.string().trim().min(1).max(300),
      })
      .optional(),
    replyTo: z
      .object({
        wamid: z.string().min(1),
        authorName: z.string().min(1).max(120),
        body: z.string().max(500),
        messageType: z.string().optional(),
      })
      .optional(),
    template: z
      .object({
        name: z.string().min(1).max(512),
        language: z.string().min(1).max(32),
        parameterFormat: z.enum(["POSITIONAL", "NAMED"]).optional(),
        values: z.record(z.string(), z.string()).optional(),
        fields: z
          .array(
            z.object({
              section: z.enum(["header", "body"]),
              key: z.string().min(1),
              label: z.string().min(1),
            }),
          )
          .optional(),
      })
      .optional(),
  })
  .transform((v) => ({
    ...v,
    kind: v.kind ?? ("text" as const),
    text: v.text ?? "",
  }));

function mediaKindFromMime(mime: string): SendKind {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  return "document";
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;
    const user = auth.user;

    const contentType = request.headers.get("content-type") ?? "";
    const service = createServiceClient();
    const { phoneNumberId } = getKapsoConfig();
    const client = createKapsoClient();

    const { data: settings } = await service
      .from("site_settings")
      .select("contact_phone, contact_address, contact_clinic_name")
      .limit(1)
      .maybeSingle();
    const clinic = clinicContactFromSettings(settings);

    let conversationId = "";
    let kind: SendKind = "text";
    let text = "";
    let buttons: { id: string; title: string }[] | undefined;
    let ctaLabel: string | undefined;
    let ctaUrl: string | undefined;
    let location:
      | {
          latitude: number;
          longitude: number;
          name: string;
          address: string;
        }
      | undefined;
    let replyTo:
      | {
          wamid: string;
          authorName: string;
          body: string;
          messageType?: string;
        }
      | undefined;
    let mediaId: string | undefined;
    let mime: string | undefined;
    let fileName: string | undefined;
    let localPreviewUrl: string | undefined;
    let templatePayload:
      | {
          name: string;
          language: string;
          header?: { type: "text"; text: string; parameterName?: string }[];
          body?: { type: "text"; text: string; parameterName?: string }[];
        }
      | undefined;

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      conversationId = String(form.get("conversationId") ?? "");
      text = String(form.get("text") ?? "");
      const replyWamid = String(form.get("replyToWamid") ?? "");
      if (replyWamid) {
        replyTo = {
          wamid: replyWamid,
          authorName: String(form.get("replyToAuthor") || "Patient"),
          body: String(form.get("replyToBody") || ""),
        };
      }
      const file = form.get("file");
      if (!(file instanceof File) || !conversationId) {
        return NextResponse.json({ error: "Invalid body" }, { status: 400 });
      }
      mime = file.type || "application/octet-stream";
      fileName = file.name;
      kind = mediaKindFromMime(mime);
      if (form.get("kind") === "audio") kind = "audio";
      const [uploadedMediaId, storedUrl] = await Promise.all([
        uploadMediaFile(client, phoneNumberId, file, mime, fileName),
        uploadWhatsappMediaFile(service, conversationId, file, mime, fileName).catch(
          (err: unknown) => {
            console.error("[whatsapp/send] media storage upload failed", err);
            return undefined;
          },
        ),
      ]);
      mediaId = uploadedMediaId;
      localPreviewUrl = storedUrl;
    } else {
      const parsed = jsonSchema.safeParse(await request.json());
      if (!parsed.success) {
        return NextResponse.json({ error: "Invalid body" }, { status: 400 });
      }
      conversationId = parsed.data.conversationId;
      kind = parsed.data.kind;
      text = parsed.data.text?.trim() ?? "";
      buttons = parsed.data.buttons;
      ctaLabel = parsed.data.ctaLabel;
      ctaUrl = parsed.data.ctaUrl;
      location = parsed.data.location;
      replyTo = parsed.data.replyTo;
      if (kind === "template") {
        const tpl = parsed.data.template;
        if (!tpl?.name || !tpl.language) {
          return NextResponse.json({ error: "Invalid body" }, { status: 400 });
        }
        const fields = tpl.fields ?? [];
        const values = tpl.values ?? {};
        for (const field of fields) {
          if (!(values[`${field.section}.${field.key}`] ?? "").trim()) {
            return NextResponse.json(
              { error: "Missing template parameters" },
              { status: 400 },
            );
          }
        }
        const parts = buildTemplateSendParts({
          fields,
          values,
          named: (tpl.parameterFormat ?? "POSITIONAL") === "NAMED",
        });
        templatePayload = {
          name: tpl.name,
          language: tpl.language,
          header: parts.header,
          body: parts.body,
        };
      } else if (kind === "text" && !text) {
        return NextResponse.json({ error: "Invalid body" }, { status: 400 });
      } else if (kind === "interactive_buttons") {
        const problem = checkInteractiveButtons(text, buttons);
        if (problem) {
          return NextResponse.json({ error: "Invalid buttons", code: problem }, { status: 400 });
        }
      }
    }

    const conversation = await getConversation(service, conversationId);
    if (!conversation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { data: lastInbound } = await service
      .from("whatsapp_messages")
      .select("wa_timestamp")
      .eq("conversation_id", conversationId)
      .eq("direction", "inbound")
      .order("wa_timestamp", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (
      kind !== "template" &&
      !isWhatsappSessionOpen(
        latestInboundAt(conversation.last_inbound_at, [
          lastInbound?.wa_timestamp,
        ]),
      )
    ) {
      return NextResponse.json(
        {
          error: "Customer care window expired",
          code: "SESSION_EXPIRED",
        },
        { status: 409 },
      );
    }

    const to = conversation.phone_number.replace(/\D/g, "");
    const sent = await sendKapsoPayload({
      client,
      phoneNumberId,
      to,
      kind,
      text,
      mediaId,
      mime,
      fileName,
      buttons,
      ctaLabel,
      ctaUrl,
      clinic,
      location,
      contextMessageId: replyTo?.wamid,
      template: templatePayload,
    });

    if (localPreviewUrl && sent.media[0]) {
      sent.media[0] = { ...sent.media[0], url: localPreviewUrl };
    }

    // A human is now handling this thread: hold the auto-responder off for the
    // configured window. The runner also derives this from the last human
    // message, so this is belt-and-braces rather than the only signal.
    try {
      const settings = await loadAiSettings(service);
      await markHumanHandoff(
        service,
        conversation.id,
        settings.human_handoff_minutes,
      );
    } catch (err) {
      console.error("[whatsapp/send] handoff marker failed", err);
    }

    const message = await insertOutboundMessage(service, {
      conversationId: conversation.id,
      body: sent.body,
      sentBy: user.id,
      wamid: sent.wamid,
      status: "sent",
      messageType: sent.messageType,
      media: sent.media,
      flow: sent.flow,
      replyTo: replyTo ?? null,
      preview: sent.preview,
    });

    return NextResponse.json({ message });
  } catch (error) {
    console.error("[whatsapp/send]", error);
    return NextResponse.json({ error: "Send failed" }, { status: 500 });
  }
}
