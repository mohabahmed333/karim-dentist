"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { syncPreviewIframeStyles } from "../lib/syncPreviewIframeStyles";

type Props = {
  /** Logical CSS viewport width inside the iframe (drives media queries). */
  viewportWidth: number;
  className?: string;
  style?: CSSProperties;
  title?: string;
  children: ReactNode;
};

/**
 * Renders children inside an iframe so `@media` / Tailwind breakpoints use the
 * device width instead of the admin browser viewport.
 */
export function PreviewResponsiveIframe({
  viewportWidth,
  className,
  style,
  title = "Device preview",
  children,
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mountNode, setMountNode] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const doc = iframe.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=${viewportWidth}, initial-scale=1" />
  </head>
  <body style="margin:0;min-height:100%;background:#fff;overflow:auto;" data-customize-preview-scroll="true"></body>
</html>`);
    doc.close();

    doc.documentElement.lang = document.documentElement.lang;
    doc.documentElement.className = document.documentElement.className;
    doc.documentElement.style.cssText = document.documentElement.style.cssText;
    doc.documentElement.style.height = "100%";
    doc.body.style.height = "100%";

    syncPreviewIframeStyles(document, doc);

    const mount = doc.createElement("div");
    mount.id = "customize-iframe-root";
    mount.style.minHeight = "100%";
    doc.body.appendChild(mount);
    setMountNode(mount);

    const observer = new MutationObserver(() => {
      syncPreviewIframeStyles(document, doc);
    });
    observer.observe(document.head, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      observer.disconnect();
      setMountNode(null);
    };
  }, [viewportWidth]);

  return (
    <>
      <iframe
        ref={iframeRef}
        title={title}
        className={className}
        style={style}
      />
      {mountNode ? createPortal(children, mountNode) : null}
    </>
  );
}
