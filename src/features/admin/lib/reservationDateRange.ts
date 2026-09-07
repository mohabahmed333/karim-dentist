/** Widen a YYYY-MM-DD filter range so `dayIso` is included. */
export function expandDateRangeToInclude(
  from: string,
  to: string,
  dayIso: string,
): { from: string; to: string } {
  return {
    from: dayIso < from ? dayIso : from,
    to: dayIso > to ? dayIso : to,
  };
}
