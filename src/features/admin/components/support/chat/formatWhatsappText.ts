import type { ReactNode } from "react";
import { createElement, Fragment } from "react";

/** Apply WhatsApp-style *bold* _italic_ ~strike~ `code` (React escapes text). */
export function formatWhatsappText(input: string): ReactNode {
  if (!input) return null;

  const pattern =
    /(\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~|`[^`\n]+`)/g;
  const parts = input.split(pattern);

  return createElement(
    Fragment,
    null,
    ...parts.map((part, i) => {
      if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
        return createElement("strong", { key: i }, part.slice(1, -1));
      }
      if (part.startsWith("_") && part.endsWith("_") && part.length > 2) {
        return createElement("em", { key: i }, part.slice(1, -1));
      }
      if (part.startsWith("~") && part.endsWith("~") && part.length > 2) {
        return createElement("s", { key: i }, part.slice(1, -1));
      }
      if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
        return createElement(
          "code",
          {
            key: i,
            className:
              "rounded bg-black/5 px-1 py-0.5 font-mono text-[0.85em]",
          },
          part.slice(1, -1),
        );
      }
      return createElement(Fragment, { key: i }, part);
    }),
  );
}
