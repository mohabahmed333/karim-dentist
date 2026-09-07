"use client";

import { Mic, Pause, Play, Send, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "@/lib/i18n";
import { useVoiceRecorder } from "./useVoiceRecorder";
import { VoiceWaveform } from "./VoiceWaveform";

type Props = {
  onCancel: () => void;
  onSend: (file: File) => void;
};

export function VoiceRecorderBar({ onCancel, onSend }: Props) {
  const t = useTranslations();
  const { locale } = useLocale();
  const {
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
  } = useVoiceRecorder({ onCancel, onSend });

  const paused = phase === "paused";

  return (
    <div className="flex w-full items-center gap-2 px-1 py-1 sm:gap-3">
      <button
        type="button"
        onClick={discard}
        className="rounded-lg p-2 text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827]"
        aria-label={t("admin.frontDesk.deleteRecording")}
      >
        <Trash2 className="size-5" strokeWidth={1.75} />
      </button>

      <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-[#E5E7EB] bg-[#F3F4F6] px-3 py-2">
        {paused ? (
          <button
            type="button"
            onClick={togglePreview}
            className="shrink-0 rounded-full p-0.5 text-[#111827] hover:bg-white/80"
            aria-label={
              previewPlaying
                ? t("admin.frontDesk.pausePreview")
                : t("admin.frontDesk.playRecording")
            }
          >
            {previewPlaying ? (
              <Pause className="size-4" fill="currentColor" />
            ) : (
              <Play className="size-4" fill="currentColor" />
            )}
          </button>
        ) : (
          <span className="relative flex size-2.5 shrink-0">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-60" />
            <span className="relative size-2.5 rounded-full bg-red-500" />
          </span>
        )}

        <span className="shrink-0 tabular-nums text-[13px] font-medium text-[#111827]">
          {clock}
        </span>

        <VoiceWaveform
          samples={waves}
          active={phase === "recording"}
          progress={paused ? previewProgress : undefined}
          interactive={paused}
          rtl={locale === "ar"}
          onSeek={seekPreview}
        />
      </div>

      {paused ? (
        <button
          type="button"
          onClick={resume}
          className="rounded-lg p-2 text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827]"
          aria-label={t("admin.frontDesk.continueRecording")}
        >
          <Mic className="size-5" strokeWidth={1.75} />
        </button>
      ) : (
        <button
          type="button"
          onClick={pause}
          disabled={phase !== "recording"}
          className="rounded-lg p-2 text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827] disabled:opacity-40"
          aria-label={t("admin.frontDesk.pauseRecording")}
        >
          <Pause className="size-5" strokeWidth={1.75} />
        </button>
      )}

      <button
        type="button"
        onClick={stopAndSend}
        disabled={phase === "starting"}
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--admin-primary)] text-white shadow-sm hover:opacity-90 disabled:opacity-40"
        aria-label={t("admin.frontDesk.send")}
      >
        <Send className="size-4 translate-x-px -translate-y-px" strokeWidth={2} />
      </button>
    </div>
  );
}
