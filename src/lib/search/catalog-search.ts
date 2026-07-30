import { matchSorter, rankings } from "match-sorter";
import { z } from "zod";

// Relative, not "prisma/category-data": that bare specifier resolves to the
// npm `prisma` package under webpack, even though tsconfig's baseUrl maps it
// to the local prisma/ directory. tsc accepts it; the build does not.
import { categoriesWithKeywords } from "../../../prisma/category-data";

/**
 * Catalog search for products and services.
 *
 * Why the matching happens in Node rather than in the Prisma `where` clause:
 *
 *  1. Tags are `String[]` columns. Prisma's `has`/`hasSome` are exact and
 *     case-sensitive, with no `mode: "insensitive"`. Real tags in this catalog
 *     are mixed-case AND frequently multi-word ("Made in Michigan", "Detroit
 *     Shirt Company", "gold jewelry"), so a token like "michigan" can never
 *     match them through `hasSome`.
 *  2. `description` holds raw HTML from the store scrapers. A substring match
 *     against it treats markup as content, so "span", "div" or "p" match
 *     nearly every row. The markup has to be stripped before matching.
 *  3. Relevance ranking cannot be expressed in a Prisma `orderBy`.
 *
 * The routers therefore fetch candidates using only the structural filters
 * (isPublic / category / store / attributes), capped at SEARCH_CANDIDATE_CAP,
 * and hand them here. The catalog is currently ~464 products and ~16 services,
 * so this is a sub-millisecond pass over a few hundred rows.
 *
 * If the catalog grows past the cap the routers log a warning — at that point
 * this should move to Postgres full-text or pg_trgm with a GIN index rather
 * than raising the cap.
 */
export const SEARCH_CANDIDATE_CAP = 500;

/** Longest accepted query, matching the zod schema below. */
const MAX_QUERY_LENGTH = 100;

/** Bounds the work done per query; queries longer than this are truncated. */
const MAX_TOKENS = 6;

/** Tokens shorter than this are dropped ("a", "of", stray punctuation). */
const MIN_TOKEN_LENGTH = 2;

/* -------------------------------------------------------------------------- */
/* Text normalisation                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Lowercase, strip diacritics, collapse whitespace. Gives accent-insensitive
 * matching ("cafe" finds "Café") without any database support.
 */
export function normalize(input: string): string {
  return input
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Remove HTML markup and decode the entities the scrapers actually emit, so
 * that description matching sees prose rather than tags.
 */
export function stripHtml(input: string): string {
  return input
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;|&apos;/gi, "'")
    .replace(/&[a-z]+;|&#\d+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Split a raw query into normalised search tokens.
 *
 * Strips `%` and `_`, which Prisma passes through to LIKE unescaped — not an
 * injection risk (queries are parameterised) but they act as unintended
 * wildcards today.
 */
export function tokenize(raw: string): string[] {
  const cleaned = normalize(raw.slice(0, MAX_QUERY_LENGTH)).replace(
    /[%_]/g,
    " ",
  );

  const seen = new Set<string>();
  for (const token of cleaned.split(" ")) {
    if (token.length >= MIN_TOKEN_LENGTH) seen.add(token);
    if (seen.size >= MAX_TOKENS) break;
  }
  return [...seen];
}

/* -------------------------------------------------------------------------- */
/* Synonyms                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Reverse index built once at module load from the `keywords` arrays that
 * already exist in prisma/category-data.ts. Those lists are hand-written per
 * subcategory and even include common misspellings ("pendent" for "pendant"),
 * so they are a much better synonym source than anything we would invent.
 *
 * keyword -> sibling keywords + the category name it belongs to
 */
const synonymIndex: Map<string, Set<string>> = (() => {
  const index = new Map<string, Set<string>>();

  const add = (key: string, values: string[]) => {
    const normalizedKey = normalize(key);
    if (normalizedKey.length < MIN_TOKEN_LENGTH) return;
    let bucket = index.get(normalizedKey);
    if (!bucket) {
      bucket = new Set<string>();
      index.set(normalizedKey, bucket);
    }
    for (const value of values) {
      const normalizedValue = normalize(value);
      if (normalizedValue && normalizedValue !== normalizedKey) {
        bucket.add(normalizedValue);
      }
    }
  };

  for (const parent of categoriesWithKeywords) {
    const parentKeywords = parent.keywords ?? [];

    for (const child of parent.children) {
      // A child's keywords are synonyms of each other and of the child
      // category name. Deliberately NOT of the parent category name: pulling
      // "Clothing" into the expansion for "tee" made every row whose copy
      // mentions clothing a match, which is too broad to be useful.
      const related = [...child.keywords, child.name];
      for (const keyword of child.keywords) add(keyword, related);
      add(child.name, child.keywords);
    }

    add(parent.name, [
      ...parentKeywords,
      ...parent.children.map((child) => child.name),
    ]);
    for (const keyword of parentKeywords) {
      add(keyword, [parent.name, ...parentKeywords]);
    }
  }

  return index;
})();

/**
 * Expand a token into itself plus any known synonyms. Searching "tee" should
 * also surface shirts and the "Tops" category.
 */
export function expandTerm(term: string): string[] {
  const normalized = normalize(term);
  const synonyms = synonymIndex.get(normalized);
  return synonyms ? [normalized, ...synonyms] : [normalized];
}

/* -------------------------------------------------------------------------- */
/* Haystacks                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * The minimum shape the scorer needs. Both `Product` and `Service` rows (with
 * `shop` and `categories` included) structurally satisfy this.
 */
export type SearchableRow = {
  id: string;
  name: string;
  description: string | null;
  shopId: string | null;
  tags?: string[];
  attributeTags?: string[];
  materialTags?: string[];
  environmentalTags?: string[];
  aiGeneratedTags?: string[];
  shop?: { name?: string | null; ownerName?: string | null } | null;
  categories?: { name: string }[];
};

type Haystack = {
  name: string;
  description: string;
  /** All tag arrays, normalised, kept separate for exact-match scoring. */
  tags: string[];
  /** The same tags joined, so a token can match inside a multi-word tag. */
  tagText: string;
  categories: string;
  shop: string;
};

/** Haystacks are normalised, so word characters are just ASCII alphanumerics. */
const WORD_CHARACTER = /[a-z0-9]/;

/**
 * True when `term` appears at the start of a word in `haystack`.
 *
 * Plain substring matching is too forgiving in a way users notice: "div"
 * matches "in-div-idual", "span" matches "spandex". Anchoring to a word start
 * keeps the useful looseness — "mug" still matches "mugs", "michigan" still
 * matches inside the multi-word tag "Made in Michigan" — while dropping the
 * mid-word noise.
 */
function includesAtWordStart(haystack: string, term: string): boolean {
  let index = haystack.indexOf(term);
  while (index !== -1) {
    const previous = index > 0 ? haystack[index - 1] : undefined;
    if (previous === undefined || !WORD_CHARACTER.test(previous)) return true;
    index = haystack.indexOf(term, index + 1);
  }
  return false;
}

function buildHaystack(row: SearchableRow): Haystack {
  const tags = [
    ...(row.tags ?? []),
    ...(row.attributeTags ?? []),
    ...(row.materialTags ?? []),
    ...(row.environmentalTags ?? []),
    ...(row.aiGeneratedTags ?? []),
  ].map(normalize);

  return {
    name: normalize(row.name),
    description: normalize(stripHtml(row.description ?? "")),
    tags,
    tagText: tags.join(" "),
    categories: normalize(
      (row.categories ?? []).map((category) => category.name).join(" "),
    ),
    shop: normalize(`${row.shop?.name ?? ""} ${row.shop?.ownerName ?? ""}`),
  };
}

/* -------------------------------------------------------------------------- */
/* Scoring                                                                     */
/* -------------------------------------------------------------------------- */

const WEIGHTS = {
  exactName: 100,
  namePrefix: 60,
  namePhrase: 40,
  name: 25,
  tagExact: 15,
  tagPartial: 9,
  category: 10,
  shop: 8,
  description: 4,
} as const;

/** Matches reached only through a synonym count for half. */
const SYNONYM_FACTOR = 0.5;

/**
 * Human-readable reasons a row matched, so the UI can explain itself.
 * Deliberately excludes anything that isn't match quality — there is no
 * `isFeatured`, shop-size or recency signal here, so search rank can never be
 * bought or won by having a large catalog.
 */
export type MatchReason = "name" | "tag" | "category" | "shop" | "description";

export type ScoredRow<T> = {
  row: T;
  score: number;
  /** True when every token in the query matched somewhere on this row. */
  matchedAll: boolean;
  reasons: MatchReason[];
};

function scoreHaystack(
  haystack: Haystack,
  tokens: string[],
  normalizedQuery: string,
): Omit<ScoredRow<never>, "row"> {
  let score = 0;
  const reasons = new Set<MatchReason>();
  let matchedTokens = 0;

  // Whole-query bonuses. These are what put an exact title hit at the top.
  if (haystack.name === normalizedQuery) {
    score += WEIGHTS.exactName;
    reasons.add("name");
  } else if (haystack.name.startsWith(normalizedQuery)) {
    score += WEIGHTS.namePrefix;
    reasons.add("name");
  } else if (tokens.length > 1 && haystack.name.includes(normalizedQuery)) {
    // The full phrase, in order, inside a longer title.
    score += WEIGHTS.namePhrase;
    reasons.add("name");
  }

  for (const token of tokens) {
    const variants = expandTerm(token);
    let best = 0;
    let bestReason: MatchReason | null = null;

    for (const [index, variant] of variants.entries()) {
      // The token itself is variants[0]; anything after it is a synonym.
      const factor = index === 0 ? 1 : SYNONYM_FACTOR;

      const candidates: [number, MatchReason][] = [
        [
          includesAtWordStart(haystack.name, variant) ? WEIGHTS.name : 0,
          "name",
        ],
        [
          haystack.tags.includes(variant)
            ? WEIGHTS.tagExact
            : includesAtWordStart(haystack.tagText, variant)
              ? WEIGHTS.tagPartial
              : 0,
          "tag",
        ],
        [
          includesAtWordStart(haystack.categories, variant)
            ? WEIGHTS.category
            : 0,
          "category",
        ],
        [
          includesAtWordStart(haystack.shop, variant) ? WEIGHTS.shop : 0,
          "shop",
        ],
        [
          includesAtWordStart(haystack.description, variant)
            ? WEIGHTS.description
            : 0,
          "description",
        ],
      ];

      for (const [weight, reason] of candidates) {
        const value = weight * factor;
        if (value > best) {
          best = value;
          bestReason = reason;
        }
      }
    }

    if (best > 0) {
      score += best;
      matchedTokens += 1;
      if (bestReason) reasons.add(bestReason);
    }
  }

  return {
    score,
    matchedAll: tokens.length > 0 && matchedTokens === tokens.length,
    reasons: [...reasons],
  };
}

/* -------------------------------------------------------------------------- */
/* Fairness: shop interleaving                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Round-robin results across shops so a shop with hundreds of products cannot
 * monopolise the first page. Within a shop the original (score) order is
 * preserved, and shops are visited in order of their best-scoring item, so
 * relevance still leads — it just cannot crowd everyone else out.
 *
 * Applied only when a search term is present; plain category browsing keeps
 * its predictable alphabetical order.
 */
export function interleaveByShop<T>(
  rows: T[],
  getShopId: (row: T) => string | null,
): T[] {
  const buckets = new Map<string, T[]>();

  for (const row of rows) {
    // Rows without a shop share one bucket so they don't each get their own
    // round-robin slot.
    const key = getShopId(row) ?? " no-shop";
    const bucket = buckets.get(key);
    if (bucket) bucket.push(row);
    else buckets.set(key, [row]);
  }

  // Map preserves insertion order, and `rows` arrives already sorted by score,
  // so bucket order is already "best item first".
  const queues = [...buckets.values()];
  const result: T[] = [];

  for (let depth = 0; result.length < rows.length; depth += 1) {
    let placedAny = false;
    for (const queue of queues) {
      const row = queue[depth];
      if (row !== undefined) {
        result.push(row);
        placedAny = true;
      }
    }
    // Safety valve: without this an unexpected shape could spin forever.
    if (!placedAny) break;
  }

  return result;
}

/* -------------------------------------------------------------------------- */
/* Entry point                                                                 */
/* -------------------------------------------------------------------------- */

export type CatalogSearchResult<T> = {
  /** Matching rows, ranked and interleaved by shop. */
  ranked: T[];
  /** True when results came from the forgiving fallback, not an exact match. */
  isFuzzy: boolean;
  /** The tokens actually searched, for echoing back in the UI. */
  appliedTerms: string[];
  /** Nearest category/tag names when nothing matched, for the empty state. */
  suggestions: string[];
};

/**
 * Rank `candidates` against `rawQuery`.
 *
 * Pass 1 requires every token to match somewhere on the row (but not in the
 * same field), so "blue mug" finds a "Ceramic Mug" tagged "blue".
 *
 * Pass 2 only runs when pass 1 finds nothing: match-sorter over the same
 * candidates, which recovers typos ("cermic mug" -> "Ceramic Mug"). Results
 * are flagged `isFuzzy` so the UI can present them honestly as close matches.
 */
export function searchCatalog<T extends SearchableRow>(
  candidates: T[],
  rawQuery: string,
): CatalogSearchResult<T> {
  const tokens = tokenize(rawQuery);
  const normalizedQuery = normalize(rawQuery);

  if (tokens.length === 0) {
    return {
      ranked: candidates,
      isFuzzy: false,
      appliedTerms: [],
      suggestions: [],
    };
  }

  const scored: ScoredRow<T>[] = [];
  for (const row of candidates) {
    const result = scoreHaystack(buildHaystack(row), tokens, normalizedQuery);
    if (result.matchedAll) scored.push({ row, ...result });
  }

  if (scored.length > 0) {
    scored.sort(compareScored);
    return {
      ranked: interleaveByShop(
        scored.map((entry) => entry.row),
        (row) => row.shopId,
      ),
      isFuzzy: false,
      appliedTerms: tokens,
      suggestions: [],
    };
  }

  // Nothing matched exactly — be forgiving rather than showing a dead end.
  const fuzzy = fuzzyMatch(candidates, rawQuery);

  return {
    ranked: interleaveByShop(fuzzy, (row) => row.shopId),
    isFuzzy: fuzzy.length > 0,
    appliedTerms: tokens,
    suggestions: fuzzy.length === 0 ? suggestFrom(candidates, rawQuery) : [],
  };
}

/**
 * Deterministic ordering: score, then name, then id. Stable across requests so
 * results don't reshuffle between page loads.
 */
function compareScored<T extends SearchableRow>(
  a: ScoredRow<T>,
  b: ScoredRow<T>,
): number {
  if (b.score !== a.score) return b.score - a.score;
  const byName = a.row.name.localeCompare(b.row.name);
  if (byName !== 0) return byName;
  return a.row.id.localeCompare(b.row.id);
}

/** Most rows the forgiving pass will return, so a typo can't wall off the page. */
const MAX_FUZZY_RESULTS = 60;

/**
 * How far a word may be from a token and still count as a typo of it. Short
 * tokens get no slack — at three characters almost everything is within one
 * edit of everything else.
 */
function maxEditDistance(term: string): number {
  if (term.length <= 3) return 0;
  if (term.length <= 6) return 1;
  return 2;
}

/** Levenshtein distance, abandoned as soon as it exceeds `max`. */
function withinEditDistance(a: string, b: string, max: number): boolean {
  if (Math.abs(a.length - b.length) > max) return false;
  if (a === b) return true;
  if (max === 0) return false;

  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i += 1) {
    const current = [i, ...new Array<number>(b.length).fill(0)];
    let rowBest = i;

    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const value = Math.min(
        (current[j - 1] ?? 0) + 1,
        (previous[j] ?? 0) + 1,
        (previous[j - 1] ?? 0) + cost,
      );
      current[j] = value;
      if (value < rowBest) rowBest = value;
    }

    // Every remaining path can only grow, so this can never come back under max.
    if (rowBest > max) return false;
    previous = current;
  }

  return (previous[b.length] ?? Infinity) <= max;
}

/**
 * True when some word in `text` is a plausible typo of `term`.
 *
 * match-sorter's MATCHES ranking is a *subsequence* test, which is far too
 * permissive on its own — "term" matches "kitsch amber shores perfume" because
 * t, e, r and m appear in that order. Confirming an actual edit distance is
 * what separates "leathr" (a real typo of "leather") from nonsense.
 */
function hasNearWord(text: string, term: string): boolean {
  const max = maxEditDistance(term);
  for (const word of text.split(/[^a-z0-9]+/)) {
    if (word && withinEditDistance(word, term, max)) return true;
  }
  return false;
}

/**
 * Typo-tolerant fallback, run only when nothing matched exactly.
 *
 * Matching happens per token rather than on the whole query string.
 * match-sorter treats its input as one character sequence that must appear in
 * order, so the whole-query form cannot match "shoppper 313" against "The 313
 * Shopper" — the tokens are transposed. Per token, both halves match and the
 * row that matches the most tokens wins.
 */
function fuzzyMatch<T extends SearchableRow>(
  candidates: T[],
  query: string,
): T[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];

  const keys = [
    "name",
    (row: T) =>
      [
        ...(row.tags ?? []),
        ...(row.attributeTags ?? []),
        ...(row.materialTags ?? []),
        ...(row.aiGeneratedTags ?? []),
      ].join(" "),
    (row: T) => row.shop?.name ?? "",
    (row: T) => stripHtml(row.description ?? "").slice(0, 400),
  ];

  const tokensMatched = new Map<T, number>();
  const closeness = new Map<T, number>();

  // Cache per row: the edit-distance check is the expensive part.
  const searchableText = new Map<T, string>();
  const textFor = (row: T) => {
    let text = searchableText.get(row);
    if (text === undefined) {
      const haystack = buildHaystack(row);
      text = `${haystack.name} ${haystack.tagText} ${haystack.shop} ${haystack.categories} ${haystack.description}`;
      searchableText.set(row, text);
    }
    return text;
  };

  try {
    for (const token of tokens) {
      // match-sorter narrows the field cheaply; the edit-distance check then
      // confirms each survivor is a genuine near-miss rather than an
      // incidental subsequence.
      const matched = matchSorter(candidates, token, {
        keys,
        threshold: rankings.MATCHES,
      }).filter((row) => hasNearWord(textFor(row), token));

      matched.forEach((row, index) => {
        tokensMatched.set(row, (tokensMatched.get(row) ?? 0) + 1);
        // Earlier in match-sorter's own ranking is a better match.
        closeness.set(
          row,
          (closeness.get(row) ?? 0) + (matched.length - index) / matched.length,
        );
      });
    }
  } catch {
    // A forgiving fallback must never turn an empty result page into a 500.
    return [];
  }

  if (tokensMatched.size === 0) return [];

  // Every token must match, mirroring the strict pass. Accepting rows that
  // matched only *some* tokens means a query containing a word that simply
  // isn't in the catalog still returns a page of results — "qzxwvu nonsense
  // term" came back with 22 rows because "term" is one edit from "team".
  return [...tokensMatched.entries()]
    .filter(([, count]) => count === tokens.length)
    .map(([row]) => row)
    .sort((a, b) => {
      const byCloseness = (closeness.get(b) ?? 0) - (closeness.get(a) ?? 0);
      if (byCloseness !== 0) return byCloseness;
      const byName = a.name.localeCompare(b.name);
      return byName !== 0 ? byName : a.id.localeCompare(b.id);
    })
    .slice(0, MAX_FUZZY_RESULTS);
}

/** Nearest category and tag names, to offer as next steps on an empty page. */
function suggestFrom(candidates: SearchableRow[], query: string): string[] {
  const vocabulary = new Set<string>();
  for (const row of candidates) {
    for (const category of row.categories ?? []) vocabulary.add(category.name);
    for (const tag of row.tags ?? []) vocabulary.add(tag);
  }

  const tokens = tokenize(query);

  try {
    return matchSorter([...vocabulary], query, {
      threshold: rankings.MATCHES,
    })
      .filter((candidate) => {
        // Same guard as the fuzzy pass: only offer a suggestion that is
        // genuinely close to something the user typed.
        const text = normalize(candidate);
        return tokens.some((token) => hasNearWord(text, token));
      })
      .slice(0, 3);
  } catch {
    return [];
  }
}

/* -------------------------------------------------------------------------- */
/* Shared router input                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Shared by product.getAllByCategory and service.getAllByCategory, which
 * previously carried two byte-identical copies of this schema.
 *
 * `page` and `limit` were unbounded `z.number()`, so `page: 0` produced a
 * negative `skip` and `limit: 100000` was accepted.
 */
export const catalogSearchInput = z.object({
  categoryName: z.string(),
  subcategoryName: z.string().optional(),
  storeId: z.string().optional(),
  attributes: z.array(z.string()).optional(),
  sort: z.enum(["relevance", "asc", "desc"]).default("relevance"),
  search: z.string().trim().max(MAX_QUERY_LENGTH).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type CatalogSearchInput = z.infer<typeof catalogSearchInput>;
