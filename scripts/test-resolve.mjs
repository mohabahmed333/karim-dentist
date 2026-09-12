export async function resolve(specifier, context, nextResolve) {
  if (
    specifier.startsWith(".") &&
    !/\.(?:ts|tsx|js|mjs|cjs|json)$/.test(specifier)
  ) {
    for (const ext of [".ts", ".tsx"]) {
      try {
        return await nextResolve(`${specifier}${ext}`, context);
      } catch {
        // try next extension
      }
    }
  }

  if (specifier.startsWith("@/")) {
    // Resolve from repo src/, not the importing file (parentURL breaks under src/**).
    const base = new URL("../src/", import.meta.url);
    const target = new URL(specifier.slice(2), base).href;
    // Try the bare path, then as a .ts file, then as a directory's index.ts —
    // the same three shapes Next.js itself resolves. Skipping the last one
    // meant importing a bare "@/services/ai_chat" (a directory, no ai_chat.ts)
    // only worked through the app's own bundler, never through this loader —
    // so a test could not import anything that pulled it in transitively.
    for (const candidate of [target, `${target}.ts`, `${target}/index.ts`]) {
      try {
        return await nextResolve(candidate, context);
      } catch {
        // try the next shape
      }
    }
    // Let the last attempt's real error surface rather than swallowing it.
    return await nextResolve(`${target}/index.ts`, context);
  }

  return nextResolve(specifier, context);
}
