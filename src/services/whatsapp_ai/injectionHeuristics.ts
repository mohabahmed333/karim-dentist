/**
 * Patterns suggesting the patient is addressing the model rather than the
 * clinic. Any hit forces a handoff. English and Arabic, because the clinic
 * serves both.
 *
 * This is a tripwire, not a filter. Containment comes from the narrow action
 * vocabulary the bot is allowed to emit: a missed pattern costs a wrong draft,
 * never an unbounded write.
 */
const PATTERNS: { flag: string; re: RegExp }[] = [
  { flag: "ignore_instructions", re: /\bignore\s+(all\s+)?(previous|prior|above)\b/i },
  { flag: "ignore_instructions", re: /تجاهل\s+/ },
  { flag: "system_prompt", re: /\b(system|developer)\s*(prompt|message|mode)\b/i },
  { flag: "system_prompt", re: /\bprompt\s+injection\b/i },
  { flag: "role_reassign", re: /\byou\s+are\s+now\b/i },
  {
    flag: "role_reassign",
    re: /\bact\s+as\s+(an?\s+)?(admin|administrator|doctor|system)\b/i,
  },
  // No \b here: JS word boundaries are ASCII-only, so they never match
  // after an Arabic letter and would silently disable this pattern.
  { flag: "role_reassign", re: /أنت\s+الآن/ },
  { flag: "role_marker", re: /^\s*(system|assistant|developer)\s*:/im },
  { flag: "fence", re: /```/ },
  {
    flag: "envelope_forgery",
    re: /"(proposedActions|kind|handoff|confidence)"\s*:/i,
  },
  {
    flag: "override",
    re: /\b(disregard|override|bypass)\s+(the\s+)?(rules|instructions|policy)\b/i,
  },
  {
    flag: "override",
    re: /\b(reveal|show|print)\s+(me\s+)?(your\s+)?(prompt|instructions|rules)\b/i,
  },
];

/**
 * Characters that are invisible when rendered but break a pattern when matched.
 *
 * WhatsApp delivers them intact, so "ignore\u200B all\u200B previous" reads to a
 * human exactly like the phrase this module exists to catch, while `\s+` never
 * matches it — U+200B is not whitespace in JS. Zero-width joiners, bidi
 * overrides and the soft hyphen all do the same job.
 *
 * Stripped for matching only: the patient's actual text is untouched.
 */
const INVISIBLE = /[\u00AD\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF]/g;

export function injectionHeuristics(text: string): string[] {
  const flags = new Set<string>();
  const probe = text.replace(INVISIBLE, "");
  for (const { flag, re } of PATTERNS) {
    if (re.test(probe)) flags.add(flag);
  }
  return [...flags];
}
