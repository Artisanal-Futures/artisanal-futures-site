import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * The Artisanal Futures mark as a data URI for use inside `next/og` cards.
 * Returns null if the file can't be read so the card still renders, text only.
 */
export async function getOgLogoDataUri() {
  try {
    const file = await readFile(
      path.join(process.cwd(), "public", "logos", "logo-mobile.png"),
    );
    return `data:image/png;base64,${file.toString("base64")}`;
  } catch {
    return null;
  }
}
