import Image from "next/image";

/**
 * Tablet showing a real capture of the admin dashboard (taken from
 * /showreel/demo, fixture data — no real patient info). Static asset at
 * public/branding/dashboard-preview.png, kept out of /admin/* since that
 * prefix is intercepted by proxy.ts's auth guard; regenerate it if the
 * dashboard's visual design changes meaningfully.
 */
export function AuthDashboardMockup() {
  // drop-shadow rather than box-shadow so the shadow follows the tablet's
  // rotated silhouette in screen space instead of tilting with its plane; it
  // needs its own wrapper because `filter` would otherwise flatten the 3D context.
  return (
    <div
      style={{
        filter:
          "drop-shadow(0 48px 42px rgba(5,12,52,0.52)) drop-shadow(0 14px 18px rgba(5,12,52,0.32))",
      }}
      aria-hidden="true"
    >
      <div style={{ perspective: "2200px" }}>
        <div
          className="relative rounded-[2.6rem] bg-[#111114] p-4 ring-1 ring-white/25"
          style={{
            transform: "rotateX(12deg) rotateY(-3deg) rotateZ(34deg)",
            transformOrigin: "left center",
          }}
        >
          {/* front-facing camera, centred on the long left edge */}
          <span className="absolute start-[7px] top-1/2 size-[6px] -translate-y-1/2 rounded-full bg-[#33333a]" />
          <Image
            src="/branding/dashboard-preview.png"
            alt=""
            width={1600}
            height={1200}
            className="block rounded-[1.6rem]"
            priority
          />
        </div>
      </div>
    </div>
  );
}
