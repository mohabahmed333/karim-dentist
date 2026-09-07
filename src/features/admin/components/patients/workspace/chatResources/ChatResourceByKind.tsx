"use client";

import {
  ChatCbctResource,
  ChatFileResource,
  ChatImageResource,
  ChatPhotoResource,
  ChatXrayResource,
} from "./resourceCards";
import type { ChatResourceKind, ChatResourceStatus } from "./kinds";

type Props = {
  kind: ChatResourceKind;
  title: string;
  previewUrl?: string | null;
  href?: string | null;
  status?: ChatResourceStatus;
  size?: "sm" | "md";
  onRemove?: () => void;
};

export function ChatResourceByKind(props: Props) {
  const { kind, ...rest } = props;
  switch (kind) {
    case "xray":
      return <ChatXrayResource {...rest} />;
    case "cbct":
      return <ChatCbctResource {...rest} />;
    case "photo":
      return <ChatPhotoResource {...rest} />;
    case "image":
      return <ChatImageResource {...rest} />;
    case "file":
      return <ChatFileResource {...rest} />;
  }
}
