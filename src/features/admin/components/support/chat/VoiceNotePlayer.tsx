"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

type Props = {
  url: string;
  peaks?: number[];
};

const DEFAULT_PEAKS = [
  0.2, 0.45, 0.7, 0.35, 0.9, 0.4, 0.65, 0.55, 0.3, 0.8, 0.5, 0.75, 0.4, 0.6,
  0.85, 0.35, 0.55, 0.7,
];

export function VoiceNotePlayer({ url, peaks = DEFAULT_PEAKS }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [rate, setRate] = useState(1);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    function onTime() {
      if (!audio) return;
      setProgress(audio.duration ? audio.currentTime / audio.duration : 0);
    }
    function onMeta() {
      if (!audio) return;
      setDuration(audio.duration || 0);
    }
    function onEnd() {
      setPlaying(false);
      setProgress(0);
    }
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnd);
    };
  }, []);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      void audio.play();
      setPlaying(true);
    }
  }

  function cycleRate() {
    const next = rate === 1 ? 1.5 : rate === 1.5 ? 2 : 1;
    setRate(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  }

  function seek(ratio: number) {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    audio.currentTime = ratio * audio.duration;
  }

  const timeLabel = `${Math.floor((progress * duration) || 0)}s / ${Math.floor(duration || 0)}s`;

  return (
    <div className="mb-2 flex min-w-[220px] items-center gap-2 rounded-xl bg-[#EEF2FF] px-2.5 py-2">
      <audio ref={audioRef} src={url} preload="metadata" />
      <button
        type="button"
        onClick={toggle}
        className="rounded-full bg-[#111827] p-1.5 text-white"
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? (
          <Pause className="h-3.5 w-3.5" />
        ) : (
          <Play className="h-3.5 w-3.5" />
        )}
      </button>
      <button
        type="button"
        className="flex h-8 flex-1 items-end gap-0.5"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          seek((e.clientX - rect.left) / rect.width);
        }}
        aria-label="Seek"
      >
        {peaks.map((p, i) => (
          <span
            key={i}
            className="w-1 rounded-sm bg-[#6366F1]"
            style={{
              height: `${Math.max(4, p * 28)}px`,
              opacity: i / peaks.length <= progress ? 1 : 0.35,
            }}
          />
        ))}
      </button>
      <button
        type="button"
        onClick={cycleRate}
        className="rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold text-[#4338CA]"
      >
        {rate}x
      </button>
      <span className="text-[10px] text-[#6B7280]">{timeLabel}</span>
    </div>
  );
}
