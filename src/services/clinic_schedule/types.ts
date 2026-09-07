export type ClinicHours = {
  id: string;
  open_weekdays: number[];
  time_windows: string[];
  slot_minutes: number;
  horizon_days: number;
  timezone: string;
  updated_at: string;
  created_at: string;
};

export type AppointmentSlotStatus = "open" | "booked" | "cancelled";

export type AppointmentSlot = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: AppointmentSlotStatus;
  reservation_id: string | null;
  created_at: string;
  updated_at: string;
};
