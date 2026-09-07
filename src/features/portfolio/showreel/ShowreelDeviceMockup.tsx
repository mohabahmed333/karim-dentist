"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { SHOWREEL_EMBED_READY } from "./showreelEmbedMessage";
import { revealShowreelDevice } from "./showreelDeviceReveal";
import { isShowreelEmbedReady } from "./showreelDeviceReady";

type Props = {
  variant: "desktop" | "mobile";
  src: string;
  iframeRef: RefObject<HTMLIFrameElement | null>;
  onReady?: () => void;
  className?: string;
};

const EMBED_READY_FALLBACK_MS = 12000;

export function ShowreelDeviceMockup({
  variant,
  src,
  iframeRef,
  onReady,
  className = "",
}: Props) {
  const [ready, setReady] = useState(false);
  const readyRef = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const fallbackRef = useRef<number | null>(null);
  const pollRef = useRef<number | null>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  const rootClass = [
    "showreel-device",
    ready ? "" : "is-device-pending",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const stopPolling = useCallback(() => {
    if (pollRef.current === null) return;
    window.clearInterval(pollRef.current);
    pollRef.current = null;
  }, []);

  const markReady = useCallback(() => {
    if (readyRef.current) return;
    readyRef.current = true;
    stopPolling();
    if (fallbackRef.current !== null) {
      window.clearTimeout(fallbackRef.current);
      fallbackRef.current = null;
    }

    setReady(true);
    onReadyRef.current?.();

    const root = rootRef.current;
    if (root) {
      root.classList.remove("is-device-pending");
      revealShowreelDevice(root);
    }
  }, [stopPolling]);

  useEffect(() => {
    readyRef.current = false;
    setReady(false);
    rootRef.current?.classList.add("is-device-pending");

    fallbackRef.current = window.setTimeout(() => markReady(), EMBED_READY_FALLBACK_MS);

    return () => {
      stopPolling();
      if (fallbackRef.current !== null) {
        window.clearTimeout(fallbackRef.current);
        fallbackRef.current = null;
      }
    };
  }, [src, markReady, stopPolling]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== SHOWREEL_EMBED_READY) return;

      const iframeWin = iframeRef.current?.contentWindow;
      if (!iframeWin || event.source !== iframeWin) return;

      markReady();
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [iframeRef, markReady]);

  const checkIframeReady = useCallback(() => {
    const root = iframeRef.current?.contentDocument;
    if (!root) return false;

    const mode = src.includes("mode=customize") ? "customize" : "site";
    if (!isShowreelEmbedReady(root, mode)) return false;

    markReady();
    return true;
  }, [iframeRef, markReady, src]);

  const onIframeLoad = () => {
    stopPolling();
    if (checkIframeReady()) return;

    pollRef.current = window.setInterval(checkIframeReady, 100);
  };

  const screenClass = ready
    ? "showreel-device-screen is-ready"
    : "showreel-device-screen is-loading";

  if (variant === "mobile") {
    return (
      <div ref={rootRef} className={`${rootClass} showreel-device--mobile`}>
        <div className="showreel-device-phone">
          <div className="showreel-device-island" aria-hidden />
          <div className={screenClass}>
            <iframe
              ref={iframeRef}
              title="Mobile preview"
              src={src}
              className="showreel-device-iframe"
              onLoad={onIframeLoad}
            />
          </div>
          <div className="showreel-device-home-bar" aria-hidden />
        </div>
      </div>
    );
  }

  return (
    <div ref={rootRef} className={`${rootClass} showreel-device--desktop`}>
      <div className="showreel-device-monitor">
        <div className="showreel-device-monitor-top">
          <span className="showreel-device-dot" />
          <span className="showreel-device-camera" />
          <span className="showreel-device-dot" />
        </div>
        <div className={screenClass}>
          <iframe
            ref={iframeRef}
            title="Desktop preview"
            src={src}
            className="showreel-device-iframe"
            onLoad={onIframeLoad}
          />
        </div>
      </div>
      <div className="showreel-device-stand" aria-hidden>
        <div className="showreel-device-stand-neck" />
        <div className="showreel-device-stand-base" />
      </div>
    </div>
  );
}

export function useShowreelIframeRef() {
  return useRef<HTMLIFrameElement | null>(null);
}
