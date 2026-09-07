"use client";

import { ChatResourceByKind } from "./chatResources/ChatResourceByKind";
import {
  inferChatResourceKind,
  type ChatResourceKind,
} from "./chatResources/kinds";
import type { PendingChatUpload } from "./chatResources/pendingUpload";
import { CHAT_BODY } from "./chatSkin";

export type ChatAttachmentItem = {
  id: string;
  title: string;
  kind: string;
  url: string;
};

type Props = {
  items: ChatAttachmentItem[];
  pendingUploads?: PendingChatUpload[];
  uploading?: boolean;
};

export function ChatAttachmentsTab({
  items,
  pendingUploads = [],
  uploading = false,
}: Props) {
  const empty = items.length === 0 && pendingUploads.length === 0;

  return (
    <div className={`min-h-0 flex-1 overflow-y-auto ${CHAT_BODY} p-4`}>
      {empty ? (
        <p className="pt-12 text-center text-[12px] text-[#9CA3AF]">
          No attachments for this tooth yet. Paste or attach images in Chat.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {pendingUploads.map((item) => (
            <li key={item.id}>
              <ChatResourceByKind
                kind={item.kind}
                title={item.file.name}
                previewUrl={item.previewUrl}
                status={uploading ? "uploading" : "ready"}
              />
            </li>
          ))}
          {items.map((item) => (
            <li key={item.id}>
              <ChatResourceByKind
                kind={inferChatResourceKind(item.kind) as ChatResourceKind}
                title={item.title}
                previewUrl={item.url}
                href={item.url}
                status="ready"
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
