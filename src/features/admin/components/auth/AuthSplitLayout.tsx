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
        className="relative hidden overflow-hidden lg:flex lg:w-1/2 lg:items-center lg:justify-center"
        style={{
          background:
            "linear-gradient(135deg, var(--admin-primary, #5e6ad2), var(--admin-secondary, #3b82f6))",
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.18),transparent_45%)]" />
        <div className="relative z-10 flex w-full max-w-xl flex-col gap-14 px-10">
          <div className="max-w-sm">
            <h2 className="text-4xl font-semibold leading-tight text-white">
              {headline}
            </h2>
            <p className="mt-3 text-base text-white/80">{tagline}</p>
          </div>
          <AuthDashboardMockup />
        </div>
      </div>
    </div>
  );
}
