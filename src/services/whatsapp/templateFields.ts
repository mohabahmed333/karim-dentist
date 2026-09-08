export type TemplateFieldSection = "header" | "body";

export type TemplateField = {
  section: TemplateFieldSection;
  key: string;
  label: string;
};

export type TemplateComponent = Record<string, unknown>;

const PLACEHOLDER_RE = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

function componentType(c: TemplateComponent): string {
  return String(c.type ?? "").toUpperCase();
}

function extractKeys(text: string): string[] {
  const keys: string[] = [];
  const seen = new Set<string>();
  for (const match of text.matchAll(PLACEHOLDER_RE)) {
    const key = match[1];
    if (!key || seen.has(key)) continue;
    seen.add(key);
    keys.push(key);
  }
  return keys;
}

/** v1: only text (or no) headers — media headers unsupported in-app. */
export function templateSupportsAppSend(
  components: TemplateComponent[] | null | undefined,
): boolean {
  for (const c of components ?? []) {
    if (componentType(c) !== "HEADER") continue;
    const format = String(c.format ?? "TEXT").toUpperCase();
    if (format !== "TEXT") return false;
  }
  return true;
}

export function parseTemplateFields(
  components: TemplateComponent[] | null | undefined,
): TemplateField[] {
  const fields: TemplateField[] = [];
  for (const c of components ?? []) {
    const type = componentType(c);
    if (type !== "HEADER" && type !== "BODY") continue;
    if (type === "HEADER") {
      const format = String(c.format ?? "TEXT").toUpperCase();
      if (format !== "TEXT") continue;
    }
    const section: TemplateFieldSection = type === "HEADER" ? "header" : "body";
    const text = typeof c.text === "string" ? c.text : "";
    for (const key of extractKeys(text)) {
      fields.push({ section, key, label: `{{${key}}}` });
    }
  }
  return fields;
}

export type TemplateSendParam = {
  type: "text";
  text: string;
  parameterName?: string;
};

export function buildTemplateSendParts(input: {
  fields: TemplateField[];
  values: Record<string, string>;
  named?: boolean;
}): { header?: TemplateSendParam[]; body?: TemplateSendParam[] } {
  const header: TemplateSendParam[] = [];
  const body: TemplateSendParam[] = [];
  for (const field of input.fields) {
    const raw = input.values[`${field.section}.${field.key}`]?.trim() ?? "";
    const param: TemplateSendParam = input.named
      ? { type: "text", text: raw, parameterName: field.key }
      : { type: "text", text: raw };
    if (field.section === "header") header.push(param);
    else body.push(param);
  }
  return {
    header: header.length ? header : undefined,
    body: body.length ? body : undefined,
  };
}
