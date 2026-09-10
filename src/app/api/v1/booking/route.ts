import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { publicBookSchema } from "@/services/clinic_schedule/publicBookSchema";
import { checkRateLimit } from "@/lib/rateLimit/checkRateLimit";
import { extractClientIp } from "@/lib/rateLimit/clientIp";
import { canonicalPhoneDigits } from "@/services/reservations/patientHistory";

// Fully public, unauthenticated, and writes straight to the reservations
// table — book_open_appointment_slot already prevents double-booking one
// slot, but nothing stopped a single caller from working through every
// open slot. Two independent limits: per IP (catches a scripted burst from
// one source) and per phone (catches the same person/bot rotating IPs).
const IP_LIMIT = { max: 5, windowSeconds: 10 * 60 };
const PHONE_LIMIT = { max: 3, windowSeconds: 60 * 60 };

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = publicBookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid booking" },
      { status: 400 },
    );
  }

  const ip = extractClientIp(request.headers);
  const ipAllowed = await checkRateLimit("booking:ip", ip, IP_LIMIT.max, IP_LIMIT.windowSeconds);
  if (!ipAllowed) {
    return NextResponse.json(
      { error: "Too many booking attempts. Please try again in a few minutes." },
      { status: 429, headers: { "Cache-Control": "no-store" } },
    );
  }

  const phoneKey = canonicalPhoneDigits(parsed.data.phone) || parsed.data.phone;
  const phoneAllowed = await checkRateLimit(
    "booking:phone",
    phoneKey,
    PHONE_LIMIT.max,
    PHONE_LIMIT.windowSeconds,
  );
  if (!phoneAllowed) {
    return NextResponse.json(
      { error: "Too many booking attempts for this phone number. Please contact the clinic directly." },
      { status: 429, headers: { "Cache-Control": "no-store" } },
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("book_open_appointment_slot", {
    p_slot_id: parsed.data.slot_id,
    p_patient_name: parsed.data.patient_name,
    p_phone: parsed.data.phone,
    p_email: parsed.data.email || null,
    p_service_id: parsed.data.service_id ?? null,
    p_service_label: parsed.data.service_label,
    p_notes: parsed.data.notes ?? "",
  });

  if (error) {
    const status = error.message.includes("no longer available") ? 409 : 400;
    return NextResponse.json(
      { error: error.message },
      { status, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    { reservation_id: data },
    { headers: { "Cache-Control": "no-store" } },
  );
}
