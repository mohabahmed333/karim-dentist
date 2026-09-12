import type { ActionKind } from "./schemas";

/**
 * Human labels for the review card. Staff never see the raw `chart.set_surfaces`
 * enum value the model uses — they see what it means.
 */
const LABELS: Record<ActionKind, { en: string; ar: string }> = {
  "navigate.open_patient": { en: "Open patient", ar: "فتح ملف المريض" },
  "navigate.focus_tooth": { en: "Focus tooth", ar: "التركيز على السن" },
  "cms.update_singleton": { en: "Update website section", ar: "تحديث قسم بالموقع" },
  "cms.upsert_item": { en: "Add or edit website item", ar: "إضافة أو تعديل عنصر بالموقع" },
  "cms.reorder": { en: "Reorder website items", ar: "إعادة ترتيب عناصر الموقع" },
  "cms.archive": { en: "Archive website item", ar: "أرشفة عنصر بالموقع" },
  "cms.set_media": { en: "Update website image", ar: "تحديث صورة بالموقع" },
  "note.general": { en: "Add front-desk note", ar: "إضافة ملاحظة استقبال" },
  "note.clinical": { en: "Add clinical note", ar: "إضافة ملاحظة سريرية" },
  "chart.set_surfaces": { en: "Chart tooth surfaces", ar: "تحديث سطوح السن بالمخطط" },
  "chart.upsert_finding": { en: "Record chart finding", ar: "تسجيل ملاحظة بالمخطط" },
  "treatment.create": { en: "Add required treatment", ar: "إضافة علاج مطلوب" },
  "treatment.update": { en: "Update treatment", ar: "تحديث العلاج" },
  "treatment.complete": { en: "Mark treatment complete", ar: "تحديد العلاج كمكتمل" },
  "imaging.attach": { en: "Attach image", ar: "إرفاق صورة" },
  "rx.create": { en: "Add prescription", ar: "إضافة روشتة" },
  "lab.create": { en: "Add lab case", ar: "إضافة حالة معمل" },
  "lab.update_status": { en: "Update lab status", ar: "تحديث حالة المعمل" },
  "followup.book": { en: "Book follow-up visit", ar: "حجز زيارة متابعة" },
  "reservation.create": { en: "Book appointment", ar: "حجز موعد" },
  "reservation.reschedule": { en: "Reschedule appointment", ar: "تغيير موعد الحجز" },
  "reservation.cancel": { en: "Cancel appointment", ar: "إلغاء الموعد" },
  "reservation.set_status": { en: "Update appointment status", ar: "تحديث حالة الموعد" },
  "whatsapp.send_text": { en: "Send WhatsApp message", ar: "إرسال رسالة واتساب" },
  "whatsapp.send_template": { en: "Send WhatsApp template", ar: "إرسال قالب واتساب" },
  "whatsapp.set_status": { en: "Update conversation status", ar: "تحديث حالة المحادثة" },
  "whatsapp.add_note": { en: "Add internal note", ar: "إضافة ملاحظة داخلية" },
  "patient.upsert_profile": { en: "Update patient profile", ar: "تحديث ملف المريض" },
  "encounter.create": { en: "Record visit", ar: "تسجيل زيارة" },
  "schedule.set_hours": { en: "Update clinic hours", ar: "تحديث مواعيد العمل" },
  "schedule.regenerate_slots": { en: "Rebuild open slots", ar: "إعادة بناء المواعيد المتاحة" },
};

export function actionKindLabel(kind: string, locale: "en" | "ar" = "en"): string {
  const entry = LABELS[kind as ActionKind];
  if (!entry) return kind;
  return locale === "ar" ? entry.ar : entry.en;
}
