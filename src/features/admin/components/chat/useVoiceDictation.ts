"use client";

import { useRef, useState } from "react";

export type VoiceDictationState = "idle" | "recording" | "transcribing";

/**
 * Record a short clip and turn it into text via /api/v1/ai/transcribe.
 *
 * No waveform, no preview-before-send, no scrubbing — unlike the WhatsApp
 * composer's voice notes (a message the patient will hear), this is dictation
 * a doctor edits before sending, so the bar is "get it into the composer",
 * not "record something publishable on the first take".
 */
export function useVoiceDictation(onText: (text: string) => void) {
  const [state, setState] = useState<VoiceDictationState>("idle");
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const cancelledRef = useRef(false);

  function stopStream() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  async function start() {
    if (state !== "idle") return;
    setError(null);
    cancelledRef.current = false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        stopStream();
        if (cancelledRef.current) return;
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        void transcribe(blob);
      };

      recorderRef.current = recorder;
      recorder.start();
      setState("recording");
    } catch {
      stopStream();
      setState("idle");
      setError("microphone unavailable");
    }
  }

  function stop() {
    if (state !== "recording") return;
    setState("transcribing");
    recorderRef.current?.stop();
  }

  async function transcribe(blob: Blob) {
    try {
      const form = new FormData();
      form.append("audio", blob, "dictation.webm");
      const res = await fetch("/api/v1/ai/transcribe", { method: "POST", body: form });
      const body = (await res.json().catch(() => ({}))) as { text?: string; error?: string };
      if (!res.ok) throw new Error(body.error ?? "Transcription failed");
      if (body.text) onText(body.text);
      else setError("Didn't catch that — try again");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transcription failed");
    } finally {
      setState("idle");
    }
  }

  /** Best-effort cleanup if the component unmounts mid-recording — no transcribe. */
  function cancel() {
    cancelledRef.current = true;
    recorderRef.current?.stop();
    stopStream();
    chunksRef.current = [];
    setState("idle");
  }

  return { state, error, start, stop, cancel };
}
