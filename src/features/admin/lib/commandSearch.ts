import type { CommandHit } from "./commandPalette";

const STOPWORDS = new Set([
  "a",
  "an",
  "the",
  "to",
  "for",
  "of",
  "and",
  "in",
  "on",
  "my",
  "me",
  "i",
  "please",
  "find",
  "show",
  "open",
  "go",
  "search",
  "want",
  "need",
  "looking",
  "change",
  "edit",
  "named",
  "name",
  "called",
  "ابحث",
  "عن",
  "في",
  "من",
  "أريد",
  "ابي",
  "عايز",
  "افتح",
  "غير",
  "عدل",
]);

const ALIAS_GROUPS: string[][] = [
  [
    "hero",
    "banner",
    "هيرو",
    "البطل",
    "واجهة",
    "شاشة",
    "homepage",
    "intro",
    "القسم الرئيسي",
    "البنر",
  ],
  [
    "patient",
    "patients",
    "directory",
    "مريض",
    "المرضى",
    "مرضى",
    "ملف",
  ],
  [
    "reservation",
    "reservations",
    "booking",
    "appointment",
    "book",
    "حجز",
    "موعد",
    "مواعيد",
  ],
  [
    "support",
    "whatsapp",
    "chat",
    "inbox",
    "استقبال",
    "واتساب",
    "محادثة",
  ],
  ["customize", "cms", "تخصيص", "محرر"],
  ["service", "services", "خدمات", "علاج"],
  ["gallery", "cases", "حالات", "صور"],
  ["contact", "تواصل", "اتصال"],
  ["settings", "settings", "إعدادات"],
  ["overview", "dashboard", "لوحة"],
  ["about", "من نحن"],
];

function tokenize(query: string): string[] {
  return query
    .trim()
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((token) => token.length > 0 && !STOPWORDS.has(token));
}

function expandToken(token: string): string[] {
  const extra: string[] = [];
  for (const group of ALIAS_GROUPS) {
    if (
      group.some(
        (alias) =>
          alias === token ||
          (alias.length >= 3 && token.length >= 3 && (alias.includes(token) || token.includes(alias))),
      )
    ) {
      extra.push(...group);
    }
  }
  return extra.length > 0 ? extra : [token];
}

function expandQuery(query: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const token of tokenize(query)) {
    for (const item of [token, ...expandToken(token)]) {
      if (seen.has(item)) continue;
      seen.add(item);
      out.push(item);
    }
  }
  return out;
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  const curr = new Array<number>(b.length + 1);
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min((curr[j - 1] ?? 0) + 1, (prev[j] ?? 0) + 1, (prev[j - 1] ?? 0) + cost);
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j] ?? 0;
  }
  return prev[b.length] ?? b.length;
}

function fuzzyMatch(haystack: string, token: string): boolean {
  if (token.length < 4) return false;
  const words = haystack.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  return words.some((word) => {
    if (Math.abs(word.length - token.length) > 1) return false;
    return levenshtein(word, token) <= 1;
  });
}

function kindBoost(hit: CommandHit, expanded: string[]): number {
  if (hit.kind === "patient" && expanded.some((t) => t === "patient" || t === "مريض")) {
    return 6;
  }
  if (
    hit.kind === "reservation" &&
    expanded.some((t) => t === "reservation" || t === "حجز" || t === "موعد")
  ) {
    return 4;
  }
  if (hit.href === "action:quick-book" && expanded.some((t) => t === "book" || t === "حجز")) {
    return 8;
  }
  return 0;
}

export function scoreCommandHit(hit: CommandHit, query: string): number {
  const expanded = expandQuery(query);
  if (expanded.length === 0) return 0;
  const title = hit.title.toLowerCase();
  const subtitle = (hit.subtitle ?? "").toLowerCase();
  const keywords = hit.keywords.toLowerCase();
  const haystack = `${title} ${subtitle} ${keywords}`;
  let score = 0;
  for (const token of expanded) {
    if (token.length < 2) continue;
    if (title.includes(token)) score += 12;
    else if (subtitle.includes(token)) score += 8;
    else if (keywords.toLowerCase().includes(token)) score += 5;
    else if (fuzzyMatch(haystack, token)) score += 3;
  }
  if (score > 0) score += kindBoost(hit, expanded);
  return score;
}

export function shouldUseAiSearch(
  query: string,
  bestScore: number,
  localCount: number,
): boolean {
  const trimmed = query.trim();
  if (trimmed.length < 4) return false;
  const rawParts = trimmed.split(/\s+/).filter(Boolean);
  if (rawParts.length >= 3) return true;
  if (localCount === 0) return true;
  if (bestScore < 8) return true;
  return false;
}
