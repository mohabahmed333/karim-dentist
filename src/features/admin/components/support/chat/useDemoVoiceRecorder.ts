"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatVoiceClock } from "./voiceRecorderHelpers";
import { WAVE_MAX } from "./voiceRecorderMedia";
import type { VoicePhase } from "./useVoiceRecorder";

type Options = {
  onCancel: () => void;
  onSend: (file: File) => void;
  enabled?: boolean;
};

/** Offline showreel recorder — animated waves, no getUserMedia. */
export function useDemoVoiceRecorder({
  onCancel,
  onSend,
  enabled = true,
}: Options) {
  const [phase, setPhase] = useState<VoicePhase>("starting");
  const [seconds, setSeconds] = useState(0);
  const [waves, setWaves] = useState<number[]>(() =>
    Array.from({ length: WAVE_MAX }, () => 0.08),
  );
  const startedAt = useRef(Date.now());
  const tickRef = useRef(0);
  const waveRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    startedAt.current = Date.now();
    setPhase("recording");
    tickRef.current = window.setInterval(() => {
      setSeconds(Math.floor((Date.now() - startedAt.current) / 1000));
    }, 200);
    waveRef.current = window.setInterval(() => {
      setWaves((prev) => {
        const next = prev.slice(1);
        const t = Date.now() / 180;
        const peak = 0.25 + Math.abs(Math.sin(t)) * 0.55 + Math.random() * 0.2;
        next.push(Math.min(1, peak));
        return next;
      });
    }, 70);
    return () => {
      window.clearInterval(tickRef.current);
      window.clearInterval(waveRef.current);
    };
  }, [enabled]);

  const discard = useCallback(() => {
    window.clearInterval(tickRef.current);
    window.clearInterval(waveRef.current);
    onCancel();
  }, [onCancel]);

  const stopAndSend = useCallback(() => {
    window.clearInterval(tickRef.current);
    window.clearInterval(waveRef.current);
    const file = new File(
      [new Uint8Array([0])],
      `showreel-voice-${Date.now()}.webm`,
      { type: "audio/webm" },
    );
    onSend(file);
  }, [onSend]);

  return {
    phase,
    clock: formatVoiceClock(seconds),
    waves,
    previewPlaying: false,
    previewProgress: 0,
    pause: () => setPhase("paused"),
    resume: () => setPhase("recording"),
    togglePreview: () => undefined,
    seekPreview: () => undefined,
    discard,
    stopAndSend,
  };
}
