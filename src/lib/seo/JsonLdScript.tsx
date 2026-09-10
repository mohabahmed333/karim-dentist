import type { JsonLdGraph } from "./jsonLd";

/**
 * Renders one JSON-LD script tag. Per the Next.js json-ld guide: a native
 * <script>, not next/script (JSON-LD is data, not executable code), and
 * JSON.stringify output must be escaped — CMS copy flows through here
 * (including TipTap rich text), and `<` is realistic, not theoretical.
 */
export function JsonLd({ graph }: { graph: JsonLdGraph | JsonLdGraph[] }) {
  const payload = Array.isArray(graph) ? graph : [graph];
  return (
    <>
      {payload.map((entry, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(entry).replace(/</g, "\\u003c"),
          }}
        />
      ))}
    </>
  );
}
