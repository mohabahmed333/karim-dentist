"use client";

type Props = {
  onFile: (file: File) => void;
};

export function ImagingEmpty({ onFile }: Props) {
  return (
    <div className="space-y-3 py-6 text-center">
      <p className="text-sm text-[#94a3b8]">
        No radiograph linked to this tooth.
      </p>
      <label className="inline-flex cursor-pointer rounded-full bg-[#2563EB] px-4 py-2 text-xs text-white">
        Upload
        <input
          type="file"
          accept="image/*,application/pdf"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onFile(file);
          }}
        />
      </label>
    </div>
  );
}
