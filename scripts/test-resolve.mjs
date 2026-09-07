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
    try {
      return await nextResolve(target, context);
    } catch {
      return await nextResolve(`${target}.ts`, context);
    }
  }

  return nextResolve(specifier, context);
}
