import type {
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/lib/supabase/database.types";

export type Reservation = Tables<"reservations">;
export type ReservationInsert = TablesInsert<"reservations">;
export type ReservationUpdate = TablesUpdate<"reservations">;

export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "no_show";

export const RESERVATION_STATUSES: ReservationStatus[] = [
  "pending",
  "confirmed",
  "cancelled",
  "completed",
  "no_show",
];

export const RESERVATION_TIME_SLOTS = [
  "10:00",
  "11:30",
  "13:00",
  "15:00",
  "17:30",
] as const;
