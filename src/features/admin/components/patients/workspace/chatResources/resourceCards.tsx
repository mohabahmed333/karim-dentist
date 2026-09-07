"use client";

import { ChatResourceTile } from "./ChatResourceTile";
import type { ChatResourceStatus } from "./kinds";

type Base = {
  title: string;
  previewUrl?: string | null;
  href?: string | null;
  status?: ChatResourceStatus;
  size?: "sm" | "md";
  onRemove?: () => void;
};

export function ChatPhotoResource(props: Base) {
  return <ChatResourceTile kind="photo" {...props} />;
}

export function ChatXrayResource(props: Base) {
  return <ChatResourceTile kind="xray" {...props} />;
}

export function ChatCbctResource(props: Base) {
  return <ChatResourceTile kind="cbct" {...props} />;
}

export function ChatImageResource(props: Base) {
  return <ChatResourceTile kind="image" {...props} />;
}

export function ChatFileResource(props: Base) {
  return <ChatResourceTile kind="file" {...props} />;
}
