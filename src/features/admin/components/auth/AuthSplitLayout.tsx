import type { ReactNode } from "react";
import { AuthBrandLockup } from "./AuthBrandLockup";
import { AuthDashboardMockup } from "./AuthDashboardMockup";

type Props = {
  children: ReactNode;
  brand: ReactNode;
  /** Brand name, shown in the lockup on both panels. */
  brandName: string;
  /** The large statement under the lockup on the brand panel. */
  headline: string;
};

/**
 * Shared shell for the pre-auth admin pages (login, forgot-password,
 * reset-password). Deliberately independent of admin dark mode — these
 * render outside AdminShell, before there's a session to read a preference
 * from — so it's a fixed light look.
 */
export function AuthSplitLayout({
  children,
  brand,
  brandName,
  headline,
}: Props) {
  return (
    <div className="admin-shell flex min-h-screen w-full bg-white">
      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-1/2 lg:px-20 xl:px-28">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-10">{brand}</div>
          {children}
        </div>
      </div>

      <div
        className="relative hidden overflow-hidden lg:block lg:w-1/2"
        style={{
          background:
            "linear-gradient(135deg, var(--admin-primary, #5e6ad2), var(--admin-secondary, #3b82f6))",
        }}
      >
        {/* soft concentric bloom behind the copy, as in the brand deck */}
        <div className="pointer-events-none absolute -start-40 -top-48 size-[38rem] rounded-full bg-white/[0.06]" />
        <div className="pointer-events-none absolute -start-16 -top-24 size-[26rem] rounded-full bg-white/[0.05]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_10%,rgba(255,255,255,0.14),transparent_55%)]" />

        <div className="relative z-10 max-w-md px-14 pt-16">
          <AuthBrandLockup name={brandName} tone="light" />
          <h2 className="mt-10 text-[2.6rem] font-semibold leading-[1.15] text-white">
            {headline}
          </h2>
        </div>

        {/* Pivots about its own left edge so the tablet sweeps from upper-right
            down to lower-left and bleeds off the right and bottom edges. */}
        <div className="absolute start-[48%] top-[39%] w-[122%] -translate-y-1/2">
          <AuthDashboardMockup />
        </div>
      </div>
    </div>
  );
}
