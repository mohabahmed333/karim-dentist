"use client";

import { PREVIEW_DEVICES, type PreviewDeviceId } from "../lib/previewDevices";

type Props = {
  value: PreviewDeviceId;
  onChange: (id: PreviewDeviceId) => void;
};

export function DeviceSwitcher({ value, onChange }: Props) {
  return (
    <div
      role="group"
      aria-label="Preview device"
      className="inline-flex w-fit items-center rounded-[10px] border border-[#e3e3e3] bg-[#f0f0f0] p-0.5"
      data-tour="devices"
    >
      {PREVIEW_DEVICES.map((device) => {
        const active = value === device.id;
        return (
          <button
            key={device.id}
            type="button"
            aria-pressed={active}
            title={device.label}
            onClick={() => onChange(device.id)}
            data-showreel-action={`customize-device-${device.id}`}
            className={
              active
                ? "inline-flex h-8 items-center gap-1.5 rounded-[8px] bg-white px-3.5 text-[12px] font-medium text-[#1a1a1a] shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                : "inline-flex h-8 items-center gap-1.5 rounded-[8px] px-3.5 text-[12px] font-medium text-[#6b6b6b] hover:text-[#1a1a1a]"
            }
          >
            <DeviceIcon id={device.id} />
            <span>{device.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function DeviceIcon({ id }: { id: PreviewDeviceId }) {
  if (id === "mobile") {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
        <rect
          x="4.25"
          y="1.75"
          width="7.5"
          height="12.5"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.25"
        />
        <circle cx="8" cy="12.25" r="0.7" fill="currentColor" />
      </svg>
    );
  }
  if (id === "tablet") {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
        <rect
          x="3"
          y="1.75"
          width="10"
          height="12.5"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.25"
        />
        <circle cx="8" cy="12.25" r="0.7" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect
        x="1.75"
        y="2.5"
        width="12.5"
        height="8.5"
        rx="1.25"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <path
        d="M5.5 13.25h5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      <path d="M8 11v2.25" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}
