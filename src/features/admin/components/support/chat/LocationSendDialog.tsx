"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  parseLatLngFromText,
  type LocationPin,
} from "./locationMap";
import { clinicLocationPin } from "./clinicLocationPin";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSend: (pin: LocationPin) => void;
  clinicAddress?: string;
};

export function LocationSendDialog({
  open,
  onOpenChange,
  onSend,
  clinicAddress,
}: Props) {
  const clinic = clinicLocationPin(clinicAddress);
  const [mode, setMode] = useState<"clinic" | "custom">("clinic");
  const [name, setName] = useState(clinic.name);
  const [address, setAddress] = useState(clinic.address);
  const [coords, setCoords] = useState(
    `${clinic.latitude}, ${clinic.longitude}`,
  );
  const [paste, setPaste] = useState("");

  function applyPaste() {
    const parsed = parseLatLngFromText(paste);
    if (!parsed) return;
    setCoords(`${parsed.latitude}, ${parsed.longitude}`);
  }

  function submit() {
    if (mode === "clinic") {
      onSend(clinic);
      onOpenChange(false);
      return;
    }
    const parsed =
      parseLatLngFromText(coords) ?? parseLatLngFromText(paste);
    if (!parsed || !name.trim()) return;
    onSend({
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      name: name.trim(),
      address: address.trim() || name.trim(),
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[#EF4444]" />
            Send location
          </DialogTitle>
        </DialogHeader>
        <div className="mb-3 flex gap-1 rounded-lg bg-[#F3F4F6] p-1">
          <ModeTab
            active={mode === "clinic"}
            label="Clinic"
            onClick={() => setMode("clinic")}
          />
          <ModeTab
            active={mode === "custom"}
            label="Custom"
            onClick={() => setMode("custom")}
          />
        </div>
        {mode === "clinic" ? (
          <div className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 text-sm">
            <p className="font-medium text-[#111827]">{clinic.name}</p>
            <p className="mt-0.5 text-xs text-[#6B7280]">{clinic.address}</p>
            <p className="mt-1 text-[11px] text-[#9CA3AF]">
              {clinic.latitude}, {clinic.longitude}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Location name"
            />
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Address"
            />
            <Input
              value={coords}
              onChange={(e) => setCoords(e.target.value)}
              placeholder="Latitude, longitude"
            />
            <div className="flex gap-2">
              <Input
                value={paste}
                onChange={(e) => setPaste(e.target.value)}
                placeholder="Paste Google Maps link"
              />
              <Button type="button" variant="outline" onClick={applyPaste}>
                Parse
              </Button>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={submit}>
            Send location
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ModeTab({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "flex-1 rounded-md bg-white px-2 py-1.5 text-xs font-semibold text-[#111827] shadow-sm"
          : "flex-1 rounded-md px-2 py-1.5 text-xs font-medium text-[#6B7280]"
      }
    >
      {label}
    </button>
  );
}
