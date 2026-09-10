/**
 * AI crawlers the clinic explicitly welcomes.
 *
 * Being readable by these agents is how the clinic gets cited when someone
 * asks an assistant "best laser dentist in New Cairo". An explicit Allow per
 * agent is redundant against `User-Agent: *` but makes the intent auditable
 * and survives a future tightening of the wildcard rule.
 */
export const AI_CRAWLER_USER_AGENTS = [
  // OpenAI
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  // Anthropic
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "anthropic-ai",
  // Perplexity
  "PerplexityBot",
  "Perplexity-User",
  // Google / Apple (these govern AI training + assistant use, not search)
  "Google-Extended",
  "Applebot",
  "Applebot-Extended",
  // Meta
  "meta-externalagent",
  "meta-externalfetcher",
  "FacebookBot",
  // Others
  "cohere-ai",
  "cohere-training-data-crawler",
  "Amazonbot",
  "DuckAssistBot",
  "YouBot",
  "AI2Bot",
  "Diffbot",
  "Timpibot",
  "Webzio-Extended",
  "ImagesiftBot",
  "MistralAI-User",
] as const;

/**
 * Heavier crawlers that have historically hammered small sites. Allowed, but
 * throttled so they cannot burn through the Supabase free-tier egress budget.
 */
export const THROTTLED_CRAWLER_USER_AGENTS = [
  "Bytespider",
  "PetalBot",
] as const;
