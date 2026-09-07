import { chartToothName } from "./names";
import { displayTooth } from "./display";
import type { NotationSystem } from "./types";

export function chartInspectorTitle(
  fdi: string,
  system: NotationSystem,
): string {
  const number = displayTooth(fdi, system).replace(/^#/, "");
  const name = chartToothName(fdi).replace(/\b\w/g, (char) =>
    char.toUpperCase(),
  );
  return `Tooth #${number} • ${name}`;
}
