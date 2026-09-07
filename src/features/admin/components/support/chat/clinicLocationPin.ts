import { CLINIC_LOCATION } from "@/lib/clinic/whatsappClinicContact";
import type { LocationPin } from "./locationMap";

export function clinicLocationPin(address?: string): LocationPin {
  return {
    latitude: CLINIC_LOCATION.latitude,
    longitude: CLINIC_LOCATION.longitude,
    name: CLINIC_LOCATION.name,
    address: address?.trim() || CLINIC_LOCATION.address,
  };
}
