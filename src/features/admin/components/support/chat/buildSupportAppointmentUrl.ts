import { encodePatientKey } from "@/services/reservations/patientHistory";
import type { FlowBookingContext } from "./FlowMessageCard";

/** Build Reservations “new appointment” URL linked back to a WhatsApp thread. */
export function buildSupportAppointmentUrl(booking: FlowBookingContext): string {
  const params = new URLSearchParams({ new: "1" });
  params.set("wa", booking.conversationId);
  if (booking.phone) params.set("phone", booking.phone);
  if (booking.name) params.set("name", booking.name);
  if (booking.patientKey) {
    params.set("patient", encodePatientKey(booking.patientKey));
  }
  return `/admin/reservations?${params.toString()}`;
}
