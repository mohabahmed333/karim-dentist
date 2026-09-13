import type { ReactNode } from "react";
import { AuthDashboardMockup } from "./AuthDashboardMockup";

type Props = {
  children: ReactNode;
  brand: ReactNode;
  headline: string;
  tagline: string;
};

/**
 * Shared shell for the pre-auth admin pages (login, forgot-password,
 * reset-password). Deliberately independent of admin dark mode — these
 * render outside AdminShell, before there's a session to read a preference
 * from — so it's a fixed light look, same as the reference design.
 */
export function AuthSplitLayout({ children, brand, headline, tagline }: Props) {
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
        {/* soft light bloom, echoing the brand deck's backdrop */}
        <div className="pointer-events-none absolute -start-32 -top-40 size-[34rem] rounded-full bg-white/[0.07]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.16),transparent_55%)]" />

        <div className="relative z-10 max-w-md px-14 pt-16">
          <h2 className="text-4xl font-semibold leading-tight text-white">
            {headline}
          </h2>
          <p className="mt-3 text-base text-white/75">{tagline}</p>
        </div>

        {/* bleeds off the right and bottom edges, as in the reference */}
        <div className="absolute start-[30%] top-[30%] w-[88%]">
          <AuthDashboardMockup />
        </div>
      </div>
    </div>
  );
}
