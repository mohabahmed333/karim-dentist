export type LocationPin = {
  latitude: number;
  longitude: number;
  name: string;
  address: string;
};

/** OpenStreetMap static preview (no API key). */
export function locationStaticMapUrl(
  latitude: number,
  longitude: number,
  size = "600x280",
): string {
  const center = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
  return `https://staticmap.openstreetmap.de/staticmap.php?center=${center}&zoom=16&size=${size}&maptype=mapnik&markers=${center},red-pushpin`;
}

export function locationMapsUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}

/** Parse lat/lng from common Google Maps / Apple Maps / raw "lat,lng" paste. */
export function parseLatLngFromText(raw: string): {
  latitude: number;
  longitude: number;
} | null {
  const text = raw.trim();
  const at = /@(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/.exec(text);
  if (at) {
    return { latitude: Number(at[1]), longitude: Number(at[2]) };
  }
  const q = /[?&](?:q|ll|query)=(-?\d+\.?\d*)[,+\s]+(-?\d+\.?\d*)/i.exec(text);
  if (q) {
    return { latitude: Number(q[1]), longitude: Number(q[2]) };
  }
  const plain = /^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/.exec(text);
  if (plain) {
    return { latitude: Number(plain[1]), longitude: Number(plain[2]) };
  }
  return null;
}
