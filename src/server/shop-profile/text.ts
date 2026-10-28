/**
 * Pure text helpers shared by the Shop Profile API's builder (`./build.ts`) and
 * network block (`./network.ts`).
 */
import type { ShopCollaboration } from "./types";
import { truncate } from "~/lib/seo/plain-text";
import { blankToNull } from "~/server/geocoding/approximate-location";

/** Placeholder `convert-to-product` writes for an empty imported description. */
const IMPORT_PLACEHOLDER = "No description available";

/** Plain text (markdown/HTML stripped), capped; blanks and the placeholder → null. */
export function plainOrNull(raw: string | null | undefined, max: number) {
  const text = truncate(raw, max);
  return text && text !== IMPORT_PLACEHOLDER ? text : null;
}

/** Trimmed, de-duplicated (case-insensitively), blanks dropped. */
export function uniqueStrings(...lists: string[][]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of lists.flat()) {
    const t = blankToNull(value);
    if (!t || seen.has(t.toLowerCase())) continue;
    seen.add(t.toLowerCase());
    out.push(t);
  }
  return out;
}

/** The `Shop` columns behind a `ShopCollaboration`. */
export type ShopCollaborationSource = {
  collabOffers: string | null;
  collabOfferTags: string[];
  collabNeeds: string | null;
  collabNeedTags: string[];
};

export function toCollaboration(
  source: ShopCollaborationSource,
  maxChars: number,
): ShopCollaboration {
  return {
    offers: plainOrNull(source.collabOffers, maxChars),
    offerTags: uniqueStrings(source.collabOfferTags),
    needs: plainOrNull(source.collabNeeds, maxChars),
    needTags: uniqueStrings(source.collabNeedTags),
  };
}

/** The shop filled in any part of its collaboration listing. */
export const hasCollaboration = (c: ShopCollaboration) =>
  !!c.offers || !!c.needs || c.offerTags.length > 0 || c.needTags.length > 0;
