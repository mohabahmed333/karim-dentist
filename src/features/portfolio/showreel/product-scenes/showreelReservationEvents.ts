export const SHOWREEL_RESERVATION_EVENT = "showreel-reservation";

export type ShowreelReservationDetail = {
  type: "fill";
  field: "patient_name" | "phone";
};
