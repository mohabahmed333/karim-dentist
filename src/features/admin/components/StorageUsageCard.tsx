import type { StorageUsageReport } from "@/services/storage/usage";

type Props = {
  report: StorageUsageReport;
};

export function StorageUsageCard({ report }: Props) {
  const width = `${Math.max(2, Math.round(report.ratio * 100))}%`;
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-[#e6e8ec]">
      <div>
        <strong className="text-sm font-medium text-[#0f2744]">Storage</strong>
        <p className="mt-1 text-sm text-[#6b7280]">
          {report.usedLabel} of {report.quotaLabel} used
        </p>
      </div>
      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-white"
        role="progressbar"
        aria-valuenow={Math.round(report.ratio * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Storage used"
      >
        <div
          className="h-full rounded-full bg-[#c9a962]"
          style={{ width }}
        />
      </div>
      <p className="mt-2 text-xs text-[#6b7280]">
        {report.remainingLabel} remaining · {report.percentLabel} used
      </p>
    </div>
  );
}
