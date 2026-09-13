export type DoctorHours = {
  doctor_id: string;
  open_weekdays: number[];
  time_windows: string[];
  slot_minutes: number;
  is_bookable: boolean;
  updated_at: string;
  created_at: string;
};
