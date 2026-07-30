import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "@playwright/test";

import { shots, type Shot } from "./shot-list";

// This repo's package.json has "type": "module", so Playwright loads e2e
// files as real ESM — __dirname isn't available, hence the import.meta.url
// derivation below.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const OUT_DIR = path.resolve(
  __dirname,
  "..",
  process.env.SHOTS_OUT_DIR ?? "docs-assets/screenshots",
);

async function captureShot(page: import("@playwright/test").Page, shot: Shot) {
  await page.goto(shot.path, { waitUntil: "networkidle" });

  if (shot.waitFor) {
    await expect(page.locator(shot.waitFor).first()).toBeVisible();
  }

  for (const action of shot.actions ?? []) {
    if (action.click) {
      await page.locator(action.click).first().click();
    }
    if (action.fill) {
      const [selector, value] = action.fill;
      await page.locator(selector).first().fill(value);
    }
  }

  // Small settle wait for animations/transitions to finish before capturing.
  await page.waitForTimeout(250);

  // The Next.js dev-mode indicator (issues badge / route info) renders inside
  // a <nextjs-portal> custom element — strip it so it never appears in docs.
  await page.evaluate(() => {
    for (const el of document.querySelectorAll("nextjs-portal")) el.remove();
  });

  const outPath = path.join(OUT_DIR, `${shot.id}.png`);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  await page.screenshot({ path: outPath, fullPage: !!shot.fullPage });
}

const byRole: Record<Shot["role"], Shot[]> = {
  admin: shots.filter((s) => s.role === "admin"),
  artisan: shots.filter((s) => s.role === "artisan"),
  public: shots.filter((s) => s.role === "public"),
};

test.describe("admin screenshots", () => {
  test.use({ storageState: "e2e/.auth/admin.json" });

  for (const shot of byRole.admin) {
    test(`capture ${shot.id}`, async ({ page }) => {
      await captureShot(page, shot);
    });
  }
});

test.describe("artisan screenshots", () => {
  test.use({ storageState: "e2e/.auth/artisan.json" });

  for (const shot of byRole.artisan) {
    test(`capture ${shot.id}`, async ({ page }) => {
      await captureShot(page, shot);
    });
  }
});

test.describe("public screenshots", () => {
  for (const shot of byRole.public) {
    test(`capture ${shot.id}`, async ({ page }) => {
      await captureShot(page, shot);
    });
  }
});
