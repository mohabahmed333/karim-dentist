import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/requireAdmin";
import { createKapsoClient, getKapsoConfig } from "@/lib/kapso/client";
import {
  parseTemplateFields,
  templateSupportsAppSend,
  type TemplateComponent,
} from "@/services/whatsapp/templateFields";

export const runtime = "nodejs";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const { businessAccountId } = getKapsoConfig();
    if (!businessAccountId) {
      return NextResponse.json(
        { error: "Missing KAPSO_BUSINESS_ACCOUNT_ID", code: "MISSING_WABA" },
        { status: 503 },
      );
    }

    const client = createKapsoClient();
    const listed = await client.templates.list({
      businessAccountId,
      status: "APPROVED",
      limit: 100,
    });

    const raw = (listed as { data?: unknown[] }).data ?? [];
    const templates = raw.map((item) => {
      const t = item as {
        id?: string;
        name?: string;
        language?: string;
        status?: string;
        category?: string;
        parameter_format?: string;
        parameterFormat?: string;
        components?: TemplateComponent[];
      };
      const components = t.components ?? [];
      const supported = templateSupportsAppSend(components);
      return {
        id: t.id ?? "",
        name: t.name ?? "",
        language: t.language ?? "",
        status: t.status ?? "APPROVED",
        category: t.category ?? "",
        parameterFormat: (
          t.parameterFormat ??
          t.parameter_format ??
          "POSITIONAL"
        ).toUpperCase(),
        components,
        fields: supported ? parseTemplateFields(components) : [],
        supported,
      };
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("[whatsapp/templates]", error);
    return NextResponse.json({ error: "List failed" }, { status: 500 });
  }
}
