/**
 * Shorten text for a meta description: strips markdown/HTML and collapses
 * whitespace, then cuts on a word boundary with an ellipsis.
 *
 * Pure (no env, no server-only) so non-page code such as the Shop Profile
 * API builder can share it; `~/lib/seo/site` re-exports it.
 */
export function truncate(text: string | null | undefined, max = 155) {
  if (!text) return "";

  const plain = text
    .replace(/<[^>]*>/g, " ") // HTML tags
    .replace(/&nbsp;/g, " ") // scraped descriptions carry HTML entities
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // markdown images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // markdown links -> link text
    .replace(/[*_~`>#]+/g, "") // markdown emphasis / headings / quotes
    .replace(/\s+/g, " ")
    .trim();

  if (plain.length <= max) return plain;

  const cut = plain.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  // Only back up to a word boundary if that doesn't throw away most of the text.
  const base = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut;
  return `${base.replace(/[\s.,;:!?-]+$/, "")}…`;
}
