"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  formatVoiceClock,
  isPreviewAtEnd,
  previewProgressFromTime,
  previewStateAtEnd,
  shouldRestartFromStart,
} from "./voiceRecorderHelpers";
import {
  buildVoiceFile,
  pickVoiceMime,
  startLevelLoop,
  WAVE_MAX,
} from "./voiceRecorderMedia";

export type VoicePhase = "starting" | "recording" | "paused";

type Options = {
  onCancel: () => void;
  onSend: (file: File) => void;
  enabled?: boolean;
};

export function useVoiceRecorder({
  onCancel,
  onSend,
  enabled = true,
}: Options) {
  const [phase, setPhase] = useState<VoicePhase>("starting");
  const [seconds, setSeconds] = useState(0);
  const [waves, setWaves] = useState<number[]>(() =>
    Array.from({ length: WAVE_MAX }, () => 0),
  );
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [previewProgress, setPreviewProgress] = useState(0);
  const [previewSeconds, setPreviewSeconds] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const disposeLevelsRef = useRef<(() => void) | null>(null);
  const previewRef = useRef<HTMLAudioElement | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const durationFallbackRef = useRef(1);
  const atEndRef = useRef(false);
  const tickRef = useRef(0);
  const startedAtRef = useRef(0);
  const elapsedRef = useRef(0);

  const applyEnded = useCallback(() => {
    const d = previewRef.current?.duration;
    const dur =
      d && Number.isFinite(d) && d > 0
        ? d
        : Math.max(0.2, durationFallbackRef.current);
    atEndRef.current = true;
    const next = previewStateAtEnd(dur);
    setPreviewPlaying(next.playing);
    setPreviewProgress(next.progress);
    setPreviewSeconds(next.seconds);
    const audio = previewRef.current;
    if (audio) {
      try {
        audio.currentTime = dur;
      } catch {
        /* ignore */
      }
    }
  }, []);

  const teardownPreview = useCallback(() => {
    const audio = previewRef.current;
    if (audio) {
      audio.onended = null;
      audio.ontimeupdate = null;
      audio.onloadedmetadata = null;
      audio.pause();
    }
    previewRef.current = null;
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    atEndRef.current = false;
    setPreviewPlaying(false);
    setPreviewProgress(0);
    setPreviewSeconds(0);
  }, []);

  const stopTracks = useCallback(() => {
    window.clearInterval(tickRef.current);
    disposeLevelsRef.current?.();
    disposeLevelsRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const resolvedDuration = useCallback(() => {
    const audio = previewRef.current;
    const d = audio?.duration;
    if (d && Number.isFinite(d) && d > 0) return d;
    return Math.max(0.2, durationFallbackRef.current);
  }, []);

  const wireAudio = useCallback(
    (audio: HTMLAudioElement) => {
      audio.ontimeupdate = () => {
        if (atEndRef.current) return;
        const dur = resolvedDuration();
        const t = audio.currentTime;
        if (isPreviewAtEnd(t, dur, audio.ended)) {
          applyEnded();
          return;
        }
        setPreviewProgress(previewProgressFromTime(t, dur));
        setPreviewSeconds(t);
      };
      audio.onended = () => {
        applyEnded();
      };
      audio.onloadedmetadata = () => {
        if (Number.isFinite(audio.duration) && audio.duration > 0) {
          durationFallbackRef.current = audio.duration;
        }
      };
    },
    [applyEnded, resolvedDuration],
  );

  const ensurePreviewAudio = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder) return null;
    if (previewRef.current && previewUrlRef.current) {
      return previewRef.current;
    }
    recorder.requestData();
    const blob = new Blob(chunksRef.current, {
      type: recorder.mimeType || "audio/webm",
    });
    if (blob.size === 0) return null;
    durationFallbackRef.current = Math.max(0.2, elapsedRef.current / 1000);
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const url = URL.createObjectURL(blob);
    previewUrlRef.current = url;
    const audio = new Audio(url);
    previewRef.current = audio;
    wireAudio(audio);
    audio.addEventListener(
      "loadedmetadata",
      () => {
        if (audio.duration === Infinity || !Number.isFinite(audio.duration)) {
          audio.currentTime = 1e101;
          audio.addEventListener(
            "timeupdate",
            () => {
              audio.currentTime = 0;
              if (Number.isFinite(audio.duration) && audio.duration > 0) {
                durationFallbackRef.current = audio.duration;
              }
            },
            { once: true },
          );
        }
      },
      { once: true },
    );
    return audio;
  }, [wireAudio]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const recorder = new MediaRecorder(stream, {
          mimeType: pickVoiceMime(),
        });
        chunksRef.current = [];
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        recorderRef.current = recorder;
        recorder.start(120);
        startedAtRef.current = Date.now();
        elapsedRef.current = 0;
        setPhase("recording");
        tickRef.current = window.setInterval(() => {
          setSeconds(
            Math.floor(
              (elapsedRef.current + Date.now() - startedAtRef.current) / 1000,
            ),
          );
        }, 250);
        disposeLevelsRef.current = startLevelLoop(
          stream,
          () => recorderRef.current?.state === "recording",
          setWaves,
        );
      } catch {
        onCancel();
      }
    }
    void start();
    return () => {
      cancelled = true;
      teardownPreview();
      try {
        recorderRef.current?.stop();
      } catch {
        /* ignore */
      }
      stopTracks();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount / enabled only
  }, [enabled]);

  function pause() {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== "recording") return;
    elapsedRef.current += Date.now() - startedAtRef.current;
    durationFallbackRef.current = Math.max(0.2, elapsedRef.current / 1000);
    recorder.requestData();
    recorder.pause();
    setPhase("paused");
    atEndRef.current = false;
    setPreviewProgress(0);
    setPreviewSeconds(0);
    window.setTimeout(() => {
      ensurePreviewAudio();
    }, 80);
  }

  function resume() {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== "paused") return;
    teardownPreview();
    startedAtRef.current = Date.now();
    recorder.resume();
    setPhase("recording");
  }

  function togglePreview() {
    if (phase !== "paused") return;
    const audio = ensurePreviewAudio();
    if (!audio) return;
    if (previewPlaying) {
      audio.pause();
      setPreviewPlaying(false);
      return;
    }
    if (shouldRestartFromStart(previewProgress) || atEndRef.current) {
      atEndRef.current = false;
      try {
        audio.currentTime = 0;
      } catch {
        /* ignore */
      }
      setPreviewProgress(0);
      setPreviewSeconds(0);
    }
    void audio
      .play()
      .then(() => setPreviewPlaying(true))
      .catch(() => {
        setPreviewPlaying(false);
      });
  }

  function seekPreview(ratio: number) {
    if (phase !== "paused") return;
    const audio = ensurePreviewAudio();
    if (!audio) return;
    const dur = resolvedDuration();
    const t = Math.min(dur, Math.max(0, ratio * dur));
    atEndRef.current = ratio >= 0.995;
    try {
      audio.currentTime = t;
    } catch {
      /* incomplete webm — still move playhead UI */
    }
    if (atEndRef.current) {
      applyEnded();
      audio.pause();
      return;
    }
    setPreviewProgress(ratio);
    setPreviewSeconds(t);
  }

  function discard() {
    teardownPreview();
    try {
      recorderRef.current?.stop();
    } catch {
      /* ignore */
    }
    stopTracks();
    onCancel();
  }

  function stopAndSend() {
    const recorder = recorderRef.current;
    if (!recorder) return;
    teardownPreview();
    recorder.onstop = () => {
      onSend(buildVoiceFile(chunksRef.current, recorder.mimeType));
      stopTracks();
    };
    if (recorder.state === "inactive") {
      onSend(buildVoiceFile(chunksRef.current, recorder.mimeType));
      stopTracks();
      return;
    }
    recorder.stop();
  }

  const clock =
    phase === "paused"
      ? formatVoiceClock(
          previewPlaying || previewProgress > 0 ? previewSeconds : seconds,
        )
      : formatVoiceClock(seconds);

  return {
    phase,
    clock,
    waves,
    previewPlaying,
    previewProgress,
    pause,
    resume,
    togglePreview,
    seekPreview,
    discard,
    stopAndSend,
  };
}
