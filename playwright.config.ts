import { readFileSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// Local runs read .env.e2e (git-ignored); CI supplies the same names directly.
try {
  for (const line of readFileSync(".env.e2e", "utf8").split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
  }
} catch {
  /* absent in CI, which sets these as real env vars */
}

const PORT = Number(process.env.E2E_PORT ?? 3100);
const baseURL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${PORT}`;

/**
 * E2E runs against a real local Supabase (`supabase start`), because the bugs
 * worth catching here — RLS, the atomic booking RPCs, the realtime inbox —
 * only exist in the database. The two external vendors are faked via env
 * (E2E_FAKE_GROQ, E2E_FAKE_KAPSO) so the suite stays offline and deterministic.
 *
 * `e2e/` sits outside `src/`, so scripts/test.sh does not pick these up.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? "list" : "html",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /global\.setup\.ts/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], storageState: "e2e/.auth/admin.json" },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: `yarn build && yarn start --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    env: {
      E2E_FAKE_GROQ: "1",
      E2E_FAKE_KAPSO: "1",
      // Present so getKapsoConfig() resolves; never used, since the send path
      // is faked above.
      KAPSO_API_KEY: "e2e",
      KAPSO_PHONE_NUMBER_ID: "e2e",
      KAPSO_WEBHOOK_SECRET: process.env.KAPSO_WEBHOOK_SECRET ?? "e2e-webhook-secret",
      // Non-empty so the policy gate sees a configured model.
      GROQ_API_KEY: "e2e",
    },
  },
});
