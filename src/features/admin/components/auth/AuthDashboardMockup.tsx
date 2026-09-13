import Image from "next/image";

/**
 * Tablet showing a real capture of the admin dashboard (taken from
 * /showreel/demo, fixture data — no real patient info). Static asset at
 * public/branding/dashboard-preview.png, kept out of /admin/* since that
 * prefix is intercepted by proxy.ts's auth guard; regenerate it if the
 * dashboard's visual design changes meaningfully.
 */
export function AuthDashboardMockup() {
  return (
    <div style={{ perspective: "2200px" }} aria-hidden="true">
      <div
        className="relative rounded-[2.4rem] bg-[#111114] p-3.5 ring-1 ring-white/15"
        style={{
          transform: "rotateX(2deg) rotateY(-14deg) rotateZ(12deg)",
          transformOrigin: "center center",
          boxShadow:
            "0 70px 130px -30px rgba(6,15,60,0.65), 0 20px 50px -20px rgba(6,15,60,0.45)",
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
  );
}
