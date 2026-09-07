/** Clinic WhatsApp contact / location defaults (Ozone Medical Center). */
export const CLINIC_DISPLAY_NAME = "The Dental Lounge";

export const CLINIC_LOCATION = {
  latitude: Number(process.env.CLINIC_LAT ?? "30.0074"),
  longitude: Number(process.env.CLINIC_LNG ?? "31.4913"),
  name: CLINIC_DISPLAY_NAME,
  address:
    process.env.CLINIC_ADDRESS ??
    "A 41 Ozone Medical Center, New Cairo, Al Narges Buildings",
};

export type ClinicContactInfo = {
  name: string;
  phone: string;
  address: string;
};

export function clinicContactFromSettings(row: {
  contact_phone?: string | null;
  contact_address?: string | null;
  contact_clinic_name?: string | null;
} | null): ClinicContactInfo {
  return {
    name: row?.contact_clinic_name?.trim() || CLINIC_DISPLAY_NAME,
    phone: row?.contact_phone?.trim() || "+20 111 192 2252",
    address:
      row?.contact_address?.trim() || CLINIC_LOCATION.address,
  };
}
