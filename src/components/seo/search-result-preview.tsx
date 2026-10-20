import { cn } from "~/lib/utils";

type Props = {
  /** Page title before the " – {siteName}" suffix the root template adds. */
  title: string;
  /** Full URL as it would be shown (origin + path). */
  url: string;
  description: string;
  siteName?: string;
  /** Use `title` as the whole <title>, without the suffix (the homepage). */
  absoluteTitle?: boolean;
  className?: string;
};

// Roughly what Google shows before truncating.
const TITLE_DISPLAY_LIMIT = 60;
const DESCRIPTION_DISPLAY_LIMIT = 160;

/** Form hint under a title/description input. */
export function characterCount(
  value: string | null | undefined,
  target: number,
) {
  const length = value?.length ?? 0;
  return `${length}/${target} characters${
    length > target ? ". Search results may cut this off." : ""
  }`;
}

/** Strip markup and cut on a word boundary, like the server-side `truncate`. */
function clip(text: string, max: number) {
  const plain = text
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= max) return plain;
  const cut = plain.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut}…`;
}

/**
 * An approximate Google result for admin forms: shows what a title,
 * description and URL will look like in search before saving.
 */
export function SearchResultPreview({
  title,
  url,
  description,
  siteName = "Artisanal Futures",
  absoluteTitle = false,
  className,
}: Props) {
  const fullTitle = absoluteTitle ? title : `${title} – ${siteName}`;
  const displayUrl = url.replace(/^https?:\/\//, "").replace(/\//g, " › ");

  return (
    <div
      className={cn("bg-background rounded-lg border p-4 text-left", className)}
      aria-label="Search result preview"
    >
      <p className="text-muted-foreground mb-1 text-xs tracking-wide uppercase">
        Search preview
      </p>
      <p className="text-muted-foreground truncate text-sm">{displayUrl}</p>
      <p className="truncate text-lg leading-snug text-[#1a0dab] dark:text-[#8ab4f8]">
        {clip(fullTitle, TITLE_DISPLAY_LIMIT)}
      </p>
      <p className="text-muted-foreground line-clamp-2 text-sm">
        {clip(description, DESCRIPTION_DISPLAY_LIMIT) || "No description"}
      </p>
    </div>
  );
}
