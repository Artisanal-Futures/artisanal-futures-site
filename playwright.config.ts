import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for the docs screenshot pipeline.
 *
 * Run via `pnpm docs:shots`, which wraps this config with dotenv-cli so that
 * `.env.docs` (local docker postgres on :3377, dev server on :3009) is layered
 * on top of `.env`. Those env vars flow through into the `webServer` child
 * process below, which is exactly what we want: the dev server it spawns
 * comes up already pointed at the local database and localhost:3009.
 */
export default defineConfig({
  testDir: "./e2e",
  outputDir: "./test-results",
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: "http://localhost:3009",
    viewport: { width: 1440, height: 900 },
    colorScheme: "light",
  },
  webServer: {
    command: "pnpm dev -p 3009",
    url: "http://localhost:3009",
    reuseExistingServer: true,
    timeout: 240_000,
  },
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "screenshots",
      testMatch: /screenshots\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
  ],
});
