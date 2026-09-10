export type FixtureReservation = {
  id: string;
  patientName: string;
  phone: string;
  serviceLabel: string;
  startsAt: string;
  status: "pending" | "confirmed" | "cancelled" | "completed" | "no_show";
};

function dayOffset(days: number, hour: number, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export const RESERVATION_FIXTURES: FixtureReservation[] = [
  {
    id: "res-sara",
    patientName: "Sara Hassan",
    phone: "+201111000001",
    serviceLabel: "Teeth whitening",
    startsAt: dayOffset(1, 10, 30),
    status: "pending",
  },
  {
    id: "res-omar",
    patientName: "Omar Farid",
    phone: "+201111000002",
    serviceLabel: "Cleaning",
    startsAt: dayOffset(1, 10, 30),
    status: "confirmed",
  },
  {
    id: "res-nour",
    patientName: "Nour El-Sayed",
    phone: "+201111000003",
    serviceLabel: "General consultation",
    startsAt: dayOffset(0, 11),
    status: "confirmed",
  },
  {
    id: "res-nour-exam",
    patientName: "Nour El-Sayed",
    phone: "+201111000003",
    serviceLabel: "Emergency exam",
    startsAt: dayOffset(-14, 16),
    status: "completed",
  },
  {
    id: "res-nour-xray",
    patientName: "Nour El-Sayed",
    phone: "+201111000003",
    serviceLabel: "Periapical imaging",
    startsAt: dayOffset(-7, 10, 30),
    status: "completed",
  },
  {
    id: "res-youssef",
    patientName: "Youssef Adel",
    phone: "+201111000004",
    serviceLabel: "General consultation",
    startsAt: dayOffset(0, 14),
    status: "pending",
  },
  {
    id: "res-mariam",
    patientName: "Mariam Khaled",
    phone: "+201111000005",
    serviceLabel: "Dental implants",
    startsAt: dayOffset(2, 15),
    status: "confirmed",
  },
  {
    id: "res-ahmed",
    patientName: "أحمد محمود",
    phone: "+201111000006",
    serviceLabel: "General consultation",
    startsAt: dayOffset(1, 11),
    status: "confirmed",
  },
  {
    id: "res-hana",
    patientName: "Hana Mostafa",
    phone: "+201111000009",
    serviceLabel: "General consultation",
    startsAt: dayOffset(-1, 10),
    status: "completed",
  },
  {
    id: "res-rami",
    patientName: "Rami Nabil",
    phone: "+201111000010",
    serviceLabel: "Cleaning",
    startsAt: dayOffset(-3, 11),
    status: "cancelled",
  },
  {
    id: "res-karim",
    patientName: "Karim Saleh",
    phone: "+201111000008",
    serviceLabel: "Cleaning",
    startsAt: dayOffset(-2, 9),
    status: "no_show",
  },
];

export const BOOKING_SLOT_FIXTURES = [
  { id: "slot-tue", label: "Tue 10:30", startsAt: dayOffset(1, 10, 30) },
  { id: "slot-wed", label: "Wed 14:00", startsAt: dayOffset(2, 14) },
  { id: "slot-thu", label: "Thu 11:00", startsAt: dayOffset(3, 11) },
];

/** Walk-in patient for the smart-ux scene's "book from the calendar" beat. */
export const RESERVATION_MODAL_FIXTURE = {
  patientName: "Dina Farouk",
  phone: "+201111000011",
  serviceLabel: "General consultation",
};

export function reservationStatusesPresent(): Set<string> {
  return new Set(RESERVATION_FIXTURES.map((r) => r.status));
}
