import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { request, test as setup } from "@playwright/test";

// This repo's package.json has "type": "module", so Playwright loads e2e
// files as real ESM — __dirname isn't available, hence the import.meta.url
// derivation below.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Logs in the two seeded demo users against the docs-only local server and
 * saves each session's storage state so the `screenshots` project can reuse
 * it via `test.use({ storageState: ... })` without re-authenticating per shot.
 *
 * Demo users are created by `pnpm docs:seed` (scripts/docs/seed-demo.ts).
 * If sign-in fails, that's almost always because seeding hasn't run yet.
 */

const DEMO_PASSWORD =
  process.env.DOCS_DEMO_PASSWORD ?? "DocsDemo!Local123";

const AUTH_DIR = path.join(__dirname, ".auth");

const DEMO_USERS = [
  {
    role: "admin",
    email: "demo-admin@artisanalfutures.org",
    storageStateFile: path.join(AUTH_DIR, "admin.json"),
  },
  {
    role: "artisan",
    email: "demo-artisan@artisanalfutures.org",
    storageStateFile: path.join(AUTH_DIR, "artisan.json"),
  },
] as const;

setup.beforeAll(() => {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
});

for (const user of DEMO_USERS) {
  setup(`authenticate as ${user.role}`, async ({ baseURL }) => {
    const context = await request.newContext({ baseURL });

    const response = await context.post("/api/auth/sign-in/email", {
      data: {
        email: user.email,
        password: DEMO_PASSWORD,
      },
    });

    if (!response.ok()) {
      const body = await response.text().catch(() => "<unreadable body>");
      throw new Error(
        `Sign-in failed for ${user.email} (status ${response.status()}). ` +
          `Did you run \`pnpm docs:seed\`? Response body: ${body}`,
      );
    }

    await context.storageState({ path: user.storageStateFile });
    await context.dispose();
  });
}
