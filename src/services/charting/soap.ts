export function vitalitySoap(input: {
  cold: string;
  ept: number;
  percussion: "negative" | "positive";
  mobility: 0 | 1 | 2 | 3;
}): string {
  const coldLabel =
    input.cold === "lingering"
      ? "lingering"
      : input.cold === "negative"
        ? "negative"
        : "normal";
  const perc = input.percussion === "positive" ? "+" : "−";
  const mob =
    input.mobility === 0 ? "0" : (["I", "II", "III"][input.mobility - 1] ?? "0");
  return `O: Cold ${coldLabel} · EPT ${input.ept} · Perc ${perc} · Mobility ${mob}`;
}

export function perioSoap(input: {
  depths: number[];
  bop: boolean[];
  recF: number;
  recL: number;
}): string {
  const labels = ["DF", "F", "MF", "DL", "L", "ML"];
  const pd = labels
    .map((label, i) => `${label}${input.depths[i] ?? 1}`)
    .join(" ");
  const bopSites = labels.filter((_, i) => input.bop[i]);
  const bop = bopSites.length > 0 ? bopSites.join(",") : "none";
  return `O: PD ${pd} · BOP ${bop} · REC F${input.recF} L${input.recL}`;
}
