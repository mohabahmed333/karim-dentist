import type { TemplateField } from "./templateFields";

function isArabicLang(language: string): boolean {
  return language.trim().toLowerCase().startsWith("ar");
}

function dummyForKey(key: string, arabic: boolean, index: number): string {
  const k = key.toLowerCase();
  if (/name|patient|customer|client|user/.test(k)) {
    return arabic ? "أحمد" : "Ahmed";
  }
  if (/clinic|doctor|practice|brand/.test(k)) {
    return arabic ? "عيادة الأسنان" : "Dental Lounge";
  }
  if (/phone|mobile|tel/.test(k)) {
    return arabic ? "01000000000" : "+201000000000";
  }
  if (/date|day|appointment/.test(k)) {
    return arabic ? "غداً" : "Tomorrow";
  }
  if (/time|hour/.test(k)) {
    return arabic ? "١٠:٠٠ ص" : "10:00 AM";
  }
  if (/service|treatment|procedure/.test(k)) {
    return arabic ? "تنظيف الأسنان" : "Teeth cleaning";
  }
  if (/address|location/.test(k)) {
    return arabic ? "القاهرة" : "Cairo";
  }

  const positional = arabic
    ? ["أحمد", "عيادة الأسنان", "غداً ١٠:٠٠ ص"]
    : ["Ahmed", "Dental Lounge", "Tomorrow 10:00 AM"];
  if (/^\d+$/.test(key)) {
    const n = Number(key);
    return positional[n - 1] ?? positional[index % positional.length]!;
  }
  return arabic ? `قيمة ${index + 1}` : `Sample ${index + 1}`;
}

/** Prefill template variable inputs with language-aware dummy values. */
export function templateDummyDefaults(
  fields: TemplateField[],
  language: string,
): Record<string, string> {
  const arabic = isArabicLang(language);
  const values: Record<string, string> = {};
  fields.forEach((field, index) => {
    values[`${field.section}.${field.key}`] = dummyForKey(
      field.key,
      arabic,
      index,
    );
  });
  return values;
}
