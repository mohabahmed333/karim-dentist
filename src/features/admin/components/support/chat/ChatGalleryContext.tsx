"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { MediaImageItem } from "./collectConversationMedia";
import { indexOfGalleryImage } from "./chatGallery";
import { ChatGalleryModal } from "./ChatGalleryModal";

type GalleryApi = {
  images: MediaImageItem[];
  openAtUrl: (url: string) => void;
};

const ChatGalleryContext = createContext<GalleryApi | null>(null);

export function ChatGalleryProvider({
  images,
  children,
}: {
  images: MediaImageItem[];
  children: ReactNode;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [sessionImages, setSessionImages] = useState<MediaImageItem[]>(images);

  const openAtUrl = useCallback(
    (url: string) => {
      const index = indexOfGalleryImage(images, url);
      if (index >= 0) {
        setSessionImages(images);
        setOpenIndex(index);
        return;
      }
      setSessionImages([{ id: `solo-${url}`, url }]);
      setOpenIndex(0);
    },
    [images],
  );

  const value = useMemo(
    () => ({ images, openAtUrl }),
    [images, openAtUrl],
  );

  return (
    <ChatGalleryContext.Provider value={value}>
      {children}
      <ChatGalleryModal
        images={sessionImages}
        index={openIndex}
        onIndexChange={setOpenIndex}
        onClose={() => setOpenIndex(null)}
      />
    </ChatGalleryContext.Provider>
  );
}

export function useChatGallery() {
  return useContext(ChatGalleryContext);
}
