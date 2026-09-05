"use client";

type Props = {
  toothLabel: string;
  progressPercent: number;
  cdtCode: string;
  urgency: "Critical" | "Minor";
  feeEgp: number;
  beforeUrl?: string | null;
  afterUrl?: string | null;
};

export function CaseDetailsPanel({
  toothLabel,
  progressPercent,
  cdtCode,
  urgency,
  feeEgp,
  beforeUrl,
  afterUrl,
}: Props) {
  const fee = new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(feeEgp);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">
          Case details
        </p>
        <h3 className="mt-1 text-base font-semibold text-[#111827]">{toothLabel}</h3>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between text-[11px] text-[#6b7280]">
          <span>Progress</span>
          <span className="font-semibold text-[#111827]">{progressPercent}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[#e5e7eb]">
          <div
            className="h-full rounded-full bg-[#2563eb]"
            style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
          />
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-[11px] text-[#6b7280]">CDT</dt>
          <dd className="font-semibold text-[#111827]">{cdtCode}</dd>
        </div>
        <div>
          <dt className="text-[11px] text-[#6b7280]">Urgency</dt>
          <dd>
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                urgency === "Critical"
                  ? "bg-red-100 text-red-800"
                  : "bg-yellow-100 text-yellow-900"
              }`}
            >
              {urgency}
            </span>
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-[11px] text-[#6b7280]">Fee</dt>
          <dd className="font-semibold text-[#111827]">{fee}</dd>
        </div>
      </dl>

      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">
          Imaging
        </p>
        <div className="grid grid-cols-2 gap-2">
          <ImagingSlot label="Before" url={beforeUrl} />
          <ImagingSlot label="After" url={afterUrl} />
        </div>
      </div>
    </div>
  );
}

function ImagingSlot({ label, url }: { label: string; url?: string | null }) {
  return (
    <div className="overflow-hidden rounded-lg border border-[#e5e7eb] bg-[#f8fafc]">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={label} className="aspect-square w-full object-cover" />
      ) : (
        <div className="flex aspect-square items-center justify-center text-[11px] text-[#9ca3af]">
          {label}
        </div>
      )}
      <p className="border-t border-[#e5e7eb] px-2 py-1 text-center text-[10px] font-medium text-[#6b7280]">
        {label}
      </p>
    </div>
  );
}
