import { env } from "~/env";

export const dynamic = "force-dynamic";

/**
 * IndexNow ownership proof: engines fetch this URL and compare it with the key
 * they were pinged with. 404 while INDEXNOW_KEY is unset.
 */
export function GET() {
  const key = env.INDEXNOW_KEY;
  if (!key) {
    return new Response("Not found", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  return new Response(key, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
