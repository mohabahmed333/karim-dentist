import Image from "next/image";

/**
 * A real capture of the admin dashboard (via /showreel/demo, fixture data —
 * no real patient data), not a hand-built approximation. Static asset at
 * public/branding/dashboard-preview.png (kept out of /admin/* — that prefix
 * is intercepted by proxy.ts's auth guard, which would otherwise redirect
 * this image request to /admin/login); regenerate it if the dashboard's
 * visual design changes meaningfully.
 */
export function AuthDashboardMockup() {
  return (
    <div
      className="pointer-events-none select-none overflow-hidden rounded-2xl shadow-[0_30px_80px_rgba(0,0,0,0.35)] ring-1 ring-black/5"
      style={{
        perspective: "1600px",
        transform: "rotate3d(0.4, -1, 0, 18deg) rotate(-2deg)",
        transformOrigin: "left center",
      }}
      aria-hidden="true"
    >
      <Image
        src="/branding/dashboard-preview.png"
        alt=""
        width={1100}
        height={970}
        className="block w-full max-w-xl"
        priority
      />
    </div>
  );
}
