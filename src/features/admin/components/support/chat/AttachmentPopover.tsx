"use client";

import { useRef, useState } from "react";
import {
  FileText,
  ImageIcon,
  MapPin,
  Contact,
  Video,
} from "lucide-react";
import type { ComposerSendPayload } from "./composerTypes";
import { LocationSendDialog } from "./LocationSendDialog";
import type { LocationPin } from "./locationMap";
import { useTranslations } from "@/lib/i18n";

type Props = {
  onSend: (payload: ComposerSendPayload) => void;
  onClose: () => void;
};

export function AttachmentPopover({ onSend, onClose }: Props) {
  const t = useTranslations();
  const mediaRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);
  const [locationOpen, setLocationOpen] = useState(false);

  function pickFile(file: File, kind: ComposerSendPayload["kind"]) {
    const url = URL.createObjectURL(file);
    onSend({
      kind,
      file,
      localMedia: [
        { url, mime: file.type, name: file.name, size: file.size },
      ],
    });
    onClose();
  }

  function sendLocation(pin: LocationPin) {
    onSend({
      kind: "location",
      text: pin.address,
      location: pin,
      flow: {
        kind: "location",
        title: pin.name,
        address: pin.address,
        latitude: pin.latitude,
        longitude: pin.longitude,
      },
    });
    onClose();
  }

  return (
    <>
      {locationOpen ? null : (
      <div className="absolute bottom-full start-0 z-20 mb-1.5 w-56 overflow-hidden rounded-lg border border-[#E5E7EB] bg-white py-1 shadow-lg">
        <input
          ref={mediaRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            pickFile(
              file,
              file.type.startsWith("video/") ? "video" : "image",
            );
            e.target.value = "";
          }}
        />
        <input
          ref={docRef}
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            pickFile(file, "document");
            e.target.value = "";
          }}
        />
        <MenuItem
          icon={<ImageIcon className="h-4 w-4" />}
          label={t("admin.frontDesk.attachImageVideo")}
          onClick={() => mediaRef.current?.click()}
        />
        <MenuItem
          icon={<FileText className="h-4 w-4" />}
          label={t("admin.frontDesk.attachDocument")}
          onClick={() => docRef.current?.click()}
        />
        <MenuItem
          icon={<Contact className="h-4 w-4" />}
          label={t("admin.frontDesk.attachContact")}
          onClick={() => {
            onSend({
              kind: "contacts",
              text: t("admin.frontDesk.clinicContact"),
            });
            onClose();
          }}
        />
        <MenuItem
          icon={<MapPin className="h-4 w-4" />}
          label={t("admin.frontDesk.attachLocation")}
          onClick={() => setLocationOpen(true)}
        />
        <Video className="hidden" />
      </div>
      )}
      <LocationSendDialog
        open={locationOpen}
        onOpenChange={(open) => {
          setLocationOpen(open);
          if (!open) onClose();
        }}
        onSend={sendLocation}
      />
    </>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#111827] hover:bg-[#F3F4F6]"
      onClick={onClick}
    >
      <span className="text-[#6B7280]">{icon}</span>
      {label}
    </button>
  );
}
