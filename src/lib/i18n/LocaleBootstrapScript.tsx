"use client";

import { useRef } from "react";
import { useServerInsertedHTML } from "next/navigation";
import { localeBootstrapScriptHtml } from "./localeStorage";

export function LocaleBootstrapScript() {
  const inserted = useRef(false);
  useServerInsertedHTML(() => {
    if (inserted.current) return null;
    const html = localeBootstrapScriptHtml("server");
    if (!html) return null;
    inserted.current = true;
    return <script dangerouslySetInnerHTML={{ __html: html }} />;
  });
  return null;
}

