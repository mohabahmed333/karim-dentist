import { CLINIC_ASSIST_TOOLS } from "./registry";

/** Injected into the system prompt alongside the action catalog. */
export const CLINIC_ASSIST_TOOL_CATALOG = [
  "You may look something up with a tool instead of guessing or asking staff to check.",
  "Tools (read-only — none of them changes data):",
  ...Object.entries(CLINIC_ASSIST_TOOLS).map(([name, def]) => `- ${name}: ${def.description}`),
  "",
  'To call one, respond with exactly this JSON object and nothing else: { "toolCall": { "name": "...", "args": { ... } } }',
  "You will get the result back as data in the next turn — then answer normally, in the Output shape. Never invent a tool result yourself. Never call a tool for something Clinic context already gives you.",
].join("\n");
