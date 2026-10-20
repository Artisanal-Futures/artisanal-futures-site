import "server-only";

import { env } from "~/env";
import { absoluteUrl, isIndexingAllowed, SITE_URL } from "~/lib/seo/site";

const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

/**
 * Tells IndexNow engines (Bing, which feeds ChatGPT search and Copilot, plus
 * Yandex and Seznam) that these site paths changed. Fire-and-forget: it never
 * throws and never blocks the mutation that calls it.
 */
export function pingIndexNow(paths: string[]) {
  const key = env.INDEXNOW_KEY;
  if (!key || !isIndexingAllowed()) return;

  const urlList = [...new Set(paths.map((path) => absoluteUrl(path)))];
  if (urlList.length === 0) return;

  void fetch(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: new URL(SITE_URL).host,
      key,
      keyLocation: absoluteUrl("/indexnow-key.txt"),
      urlList,
    }),
    signal: AbortSignal.timeout(5000),
  })
    .then((response) => {
      if (response.status !== 200 && response.status !== 202) {
        console.warn(
          `[indexnow] ${response.status} for ${urlList.length} URL(s)`,
        );
      }
    })
    .catch((error: unknown) => {
      console.warn("[indexnow] ping failed", error);
    });
}
