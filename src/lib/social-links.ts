import { MAX_LINKS } from "~/lib/validators/seo";

export type SocialPlatform =
  | "instagram"
  | "facebook"
  | "tiktok"
  | "x"
  | "youtube"
  | "linkedin"
  | "pinterest"
  | "etsy"
  | "threads"
  | "bluesky"
  | "website";

/** Host (without www./m.) -> platform. Subdomains of these also match. */
const HOSTS: Record<string, { platform: SocialPlatform; label: string }> = {
  "instagram.com": { platform: "instagram", label: "Instagram" },
  "facebook.com": { platform: "facebook", label: "Facebook" },
  "fb.com": { platform: "facebook", label: "Facebook" },
  "fb.me": { platform: "facebook", label: "Facebook" },
  "tiktok.com": { platform: "tiktok", label: "TikTok" },
  "x.com": { platform: "x", label: "X" },
  "twitter.com": { platform: "x", label: "X" },
  "youtube.com": { platform: "youtube", label: "YouTube" },
  "youtu.be": { platform: "youtube", label: "YouTube" },
  "linkedin.com": { platform: "linkedin", label: "LinkedIn" },
  "pinterest.com": { platform: "pinterest", label: "Pinterest" },
  "pin.it": { platform: "pinterest", label: "Pinterest" },
  "etsy.com": { platform: "etsy", label: "Etsy" },
  "threads.net": { platform: "threads", label: "Threads" },
  "threads.com": { platform: "threads", label: "Threads" },
  "bsky.app": { platform: "bluesky", label: "Bluesky" },
};

/** Which platform a profile URL belongs to; unknown hosts become "website". */
export function getSocialPlatform(url: string): {
  platform: SocialPlatform;
  label: string;
} {
  let hostname: string;
  try {
    hostname = new URL(
      /^https?:\/\//i.test(url) ? url : `https://${url}`,
    ).hostname
      .toLowerCase()
      .replace(/^(www|m)\./, "");
  } catch {
    return { platform: "website", label: "Link" };
  }

  const match =
    HOSTS[hostname] ??
    Object.entries(HOSTS).find(([host]) => hostname.endsWith(`.${host}`))?.[1];
  return match ?? { platform: "website", label: hostname || "Link" };
}

function toHttpUrl(value: string): string | null {
  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const { protocol, hostname } = new URL(candidate);
    // Bare words ("hello") parse as hosts; require a dot, like a real domain.
    if (!/^https?:$/.test(protocol) || !hostname.includes(".")) return null;
    return candidate;
  } catch {
    return null;
  }
}

/**
 * Turns free text (a textarea, one link per line) into a clean list of
 * http(s) URLs. Bare domains get https://; junk is dropped.
 */
export function parseSocialLinks(text: string): string[] {
  const links = text
    .split(/[\s,]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map(toHttpUrl)
    .filter((link): link is string => link !== null);

  return [...new Set(links)].slice(0, MAX_LINKS);
}
