"use client";

import dynamic from "next/dynamic";
import type { EmojiClickData } from "emoji-picker-react";
import { Theme } from "emoji-picker-react";
import { useTranslations } from "@/lib/i18n";

const Picker = dynamic(() => import("emoji-picker-react"), { ssr: false });

type Props = {
  onPick: (emoji: string) => void;
};

export function EmojiPickerPopover({ onPick }: Props) {
  const t = useTranslations();
  return (
    <div className="absolute bottom-full end-0 z-30 mb-1.5 overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-lg">
      <Picker
        theme={Theme.LIGHT}
        width={320}
        height={360}
        searchPlaceHolder={t("admin.frontDesk.searchEmoji")}
        previewConfig={{ showPreview: false }}
        skinTonesDisabled
        onEmojiClick={(emoji: EmojiClickData) => {
          onPick(emoji.emoji);
        }}
      />
    </div>
  );
}
