import { z } from "zod";
import { RESERVATION_STATUSES } from "./types";

export const reservationFormSchema = z.object({
  patient_name: z.string().trim().min(1, "Name is required"),
  phone: z.string().trim().min(1, "Phone is required"),
  email: z.string().trim().email("Invalid email").optional().or(z.literal("")),
  service_id: z.string().uuid().nullable().optional(),
  service_label: z.string().trim().min(1, "Service is required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date is required"),
  time: z.string().min(1, "Time is required"),
  slot_id: z.string().uuid().nullable().optional(),
  notes: z.string().optional(),
  status: z.enum(RESERVATION_STATUSES),
});

export type ReservationFormValues = z.infer<typeof reservationFormSchema>;

export function buildStartsAt(date: string, time: string): string {
  return new Date(`${date}T${time}:00`).toISOString();
}

export function splitStartsAt(startsAt: string): { date: string; time: string } {
  const value = new Date(startsAt);
  const date = `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
  const hours = String(value.getHours()).padStart(2, "0");
  const minutes = String(value.getMinutes()).padStart(2, "0");
  return { date, time: `${hours}:${minutes}` };
}
