import { buildLlmsFullTxt } from "~/server/seo/llms";

// Regenerate at most hourly; shops change rarely.
export const revalidate = 3600;

export async function GET() {
  try {
    return new Response(await buildLlmsFullTxt(), {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    // The database may be unreachable at build time (e.g. Docker builds); don't
    // fail the build or cache an empty file.
    console.error("[llms-full.txt] failed to build", error);
    return new Response("Temporarily unavailable", {
      status: 503,
      headers: { "Retry-After": "300" },
    });
  }
}
