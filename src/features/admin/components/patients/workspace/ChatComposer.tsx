"use client";

import { useMemo, type DragEvent, type ClipboardEvent } from "react";
import {
  ChatComposerBar,
  ChatSlashMenu,
} from "@/features/admin/components/chat";
import { useTranslations } from "@/lib/i18n";
import { ChatResourceByKind } from "./chatResources/ChatResourceByKind";
import type { PendingChatUpload } from "./chatResources/pendingUpload";
import {
  getChatSlashCommands,
  matchSlashCommands,
  type ChatSlashCommand,
} from "./chatSlashCommands";

type Props = {
  value: string;
  pending: boolean;
  pendingUploads: PendingChatUpload[];
  disabled: boolean;
  onChange: (value: string) => void;
  onSend: () => void;
  onAddFiles: (list: FileList | null) => void;
  onRemoveUpload: (id: string) => void;
  onSlashCommand: (command: ChatSlashCommand) => void;
};

export function ChatComposer({
  value,
  pending,
  pendingUploads,
  disabled,
  onChange,
  onSend,
  onAddFiles,
  onRemoveUpload,
  onSlashCommand,
}: Props) {
  const t = useTranslations();
  const slashCommands = useMemo(
    () => matchSlashCommands(value, getChatSlashCommands(t)),
    [t, value],
  );

  function onPaste(e: ClipboardEvent<HTMLDivElement>) {
    const items = e.clipboardData?.files;
    if (items && items.length > 0) {
      e.preventDefault();
      onAddFiles(items);
    }
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    onAddFiles(e.dataTransfer.files);
  }

  return (
    <div onPaste={onPaste} onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
      <ChatComposerBar
        value={value}
        pending={pending}
        disabled={disabled}
        placeholder={t("admin.chat.messageOrSlash")}
        showAttach
        onChange={onChange}
        onAddFiles={onAddFiles}
        onSend={() => {
          if (slashCommands.length === 1) {
            onChange("");
            onSlashCommand(slashCommands[0]!);
            return;
          }
          if (slashCommands.length > 0) return;
          onSend();
        }}
        topSlot={
          <>
            {pendingUploads.length > 0 ? (
              <div className="flex flex-wrap gap-2 border-b border-[#E8EAED] px-3 py-2">
                {pendingUploads.map((item) => (
                  <ChatResourceByKind
                    key={item.id}
                    kind={item.kind}
                    title={item.file.name}
                    previewUrl={item.previewUrl}
                    status={pending ? "uploading" : "ready"}
                    size="sm"
                    onRemove={() => onRemoveUpload(item.id)}
                  />
                ))}
              </div>
            ) : null}
            <ChatSlashMenu
              commands={slashCommands}
              onPick={(cmd) => {
                onChange("");
                onSlashCommand(cmd);
              }}
            />
          </>
        }
      />
    </div>
  );
}
