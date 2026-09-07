"use client";

/**
 * DISABLED placeholder CBCT SVG grid.
 * Real imaging lives in PatientXrayPane + patient_imaging service.
 */
import { CbctSlice } from "./CbctSlice";

export function ImagingPane() {
  return (
    <section className="mt-5">
      <h2 className="mb-3 text-[15px] font-medium text-[#111111]">
        Imaging (CBCT/X-Rays)
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {([0, 1, 2, 3] as const).map((variant) => (
          <article
            key={variant}
            className="overflow-hidden rounded-[28px] bg-[#111111] p-2 shadow-[0_18px_40px_rgba(17,17,17,0.18)]"
          >
            <div className="aspect-square overflow-hidden rounded-2xl">
              <CbctSlice variant={variant} />
            </div>
            <p className="px-3 py-2 text-[12px] text-white/70">
              Tooth #14 · {variant % 2 === 0 ? "Axial" : "Sagittal"} slice
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
