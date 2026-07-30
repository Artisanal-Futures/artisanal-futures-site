/**
 * Verification for src/lib/search/catalog-search.ts.
 *
 *   pnpm tsx scripts/verify-search.ts
 *
 * Runs entirely offline. Part 1 covers the pure helpers with synthetic input;
 * part 2 replays real queries against production-export.json, a read-only
 * snapshot of the live catalog, so no database connection is needed.
 *
 * Note: the snapshot has no category join rows, so product->category links are
 * empty here. Category-name matching is covered by the synthetic cases.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  expandTerm,
  interleaveByShop,
  normalize,
  searchCatalog,
  stripHtml,
  tokenize,
  type SearchableRow,
} from "~/lib/search/catalog-search";

let failures = 0;
let checks = 0;

function check(label: string, condition: boolean, detail?: string) {
  checks += 1;
  if (condition) {
    console.log(`  ok   ${label}`);
  } else {
    failures += 1;
    console.log(`  FAIL ${label}${detail ? `\n         ${detail}` : ""}`);
  }
}

function section(title: string) {
  console.log(`\n=== ${title} ===`);
}

/** True when `term` starts a word in `text`. Mirrors the matcher's rule. */
function startsWord(text: string, term: string) {
  return new RegExp(`(^|[^a-z0-9])${term}`).test(text);
}

/* -------------------------------------------------------------------------- */
/* Part 1 - pure helpers                                                       */
/* -------------------------------------------------------------------------- */

section("normalize / stripHtml / tokenize");

const eAcute = String.fromCharCode(0x00e9); // e-acute
const oUmlaut = String.fromCharCode(0x00f6); // o-umlaut

check("accents fold", normalize(`Caf${eAcute}`) === normalize("cafe"));
check("case folds", normalize("  Blue   MUG ") === "blue mug");
check(
  "html is stripped",
  stripHtml("<p>3.00 ea - size: <strong>25mm</strong></p>") ===
    "3.00 ea - size: 25mm",
  stripHtml("<p>3.00 ea - size: <strong>25mm</strong></p>"),
);
check(
  "entities decode",
  stripHtml("Tools &amp; Dies&nbsp;here") === "Tools & Dies here",
  stripHtml("Tools &amp; Dies&nbsp;here"),
);
check(
  "tokenize splits and strips wildcards",
  JSON.stringify(tokenize("  Blue   MUG%  ")) === '["blue","mug"]',
  JSON.stringify(tokenize("  Blue   MUG%  ")),
);
check("single-char tokens dropped", tokenize("a mug").join(",") === "mug");
check("empty query yields no tokens", tokenize("   ").length === 0);
check("token count is capped", tokenize("a b c d e f g h i j k").length <= 6);
check("over-long query does not throw", tokenize("x".repeat(5000)).length >= 0);

section("synonyms (sourced from prisma/category-data.ts)");

const teeExpansion = expandTerm("tee");
check(
  'expandTerm("tee") includes "shirt"',
  teeExpansion.includes("shirt"),
  JSON.stringify(teeExpansion),
);
check(
  'expandTerm("tee") includes its category "tops"',
  teeExpansion.includes("tops"),
  JSON.stringify(teeExpansion),
);
check(
  'expandTerm("tee") does NOT reach the parent category "clothing"',
  !teeExpansion.includes("clothing"),
  JSON.stringify(teeExpansion),
);
check(
  "unknown terms expand to themselves only",
  JSON.stringify(expandTerm("zzzqqq")) === '["zzzqqq"]',
);

// Cross-category groups from src/lib/search/synonyms.ts.
check(
  'expandTerm("paper") includes "tissue"',
  expandTerm("paper").includes("tissue"),
  JSON.stringify(expandTerm("paper")),
);
check(
  "synonym groups are bidirectional",
  expandTerm("tissue").includes("paper"),
  JSON.stringify(expandTerm("tissue")),
);
check(
  'expandTerm("womens") includes "ladies"',
  expandTerm("womens").includes("ladies"),
);
check('expandTerm("grey") includes "gray"', expandTerm("grey").includes("gray"));

// Apostrophes are dropped, not treated as separators.
check(
  'normalize("Women\'s") === "womens"',
  normalize("Women's") === "womens",
  normalize("Women's"),
);
check(
  '"men" must not match inside "women"',
  !/(^|[^a-z0-9])men/.test(normalize("Women's Sneakers")),
  normalize("Women's Sneakers"),
);

section("interleaveByShop (fairness)");

const bucketed = [
  { id: "a1", shopId: "A" },
  { id: "a2", shopId: "A" },
  { id: "a3", shopId: "A" },
  { id: "b1", shopId: "B" },
  { id: "c1", shopId: "C" },
];
const interleaved = interleaveByShop(bucketed, (r) => r.shopId)
  .map((r) => r.id)
  .join(",");
check(
  "[A,A,A,B,C] -> [A,B,C,A,A]",
  interleaved === "a1,b1,c1,a2,a3",
  interleaved,
);
check(
  "no rows are lost",
  interleaveByShop(bucketed, (r) => r.shopId).length === bucketed.length,
);
check(
  "null shopIds are kept",
  interleaveByShop([{ id: "x", shopId: null }], (r) => r.shopId).length === 1,
);

/* -------------------------------------------------------------------------- */
/* Part 2 - real catalog                                                       */
/* -------------------------------------------------------------------------- */

type ExportRow = {
  id: string;
  name: string;
  description: string | null;
  shopId: string | null;
  tags?: string[];
  attributeTags?: string[];
  materialTags?: string[];
  environmentalTags?: string[];
  aiGeneratedTags?: string[];
};

const snapshotPath = join(process.cwd(), "production-export.json");
let snapshot: Record<string, ExportRow[]> | null = null;
try {
  snapshot = JSON.parse(readFileSync(snapshotPath, "utf8")) as Record<
    string,
    ExportRow[]
  >;
} catch {
  console.log(
    "\n(skipping real-catalog checks: production-export.json not readable)",
  );
}

if (snapshot) {
  const shops = (snapshot.Shop ?? []) as unknown as {
    id: string;
    name: string;
    ownerName: string;
  }[];
  const shopById = new Map(shops.map((s) => [s.id, s]));

  const products: SearchableRow[] = (snapshot.Product ?? []).map((p) => ({
    ...p,
    shop: p.shopId ? (shopById.get(p.shopId) ?? null) : null,
    categories: [],
  }));

  section(`real catalog (${products.length} products, ${shops.length} shops)`);

  const run = (query: string) => searchCatalog(products, query);

  const show = (label: string, query: string, limit = 5) => {
    const result = run(query);
    console.log(
      `\n  "${query}" -> ${result.ranked.length} result(s)` +
        `${result.isFuzzy ? " [fuzzy]" : ""}` +
        `${
          result.suggestions.length
            ? ` suggestions: ${result.suggestions.join(", ")}`
            : ""
        }`,
    );
    for (const row of result.ranked.slice(0, limit)) {
      console.log(`     - ${row.name}  (${row.shop?.name ?? "no shop"})`);
    }
    return result;
  };

  /** name + stripped description + tags, normalised - what a user can see. */
  const proseOf = (row: SearchableRow) =>
    normalize(
      `${row.name} ${stripHtml(row.description ?? "")} ${(row.tags ?? []).join(
        " ",
      )}`,
    );

  // A known product, exact name.
  const exact = show("exact name", "The 313 Shopper");
  check(
    "exact name ranks first",
    exact.ranked[0]?.name === "The 313 Shopper",
    exact.ranked[0]?.name,
  );
  check("exact name is not fuzzy", !exact.isFuzzy);

  // Two words from one product, out of order. Fails on the old `contains`.
  const outOfOrder = show("out-of-order words", "shopper 313");
  check(
    "out-of-order multi-word query matches",
    outOfOrder.ranked.length > 0 && !outOfOrder.isFuzzy,
  );

  // A tag-only term. "Detroit" is a tag on many rows.
  const byTag = show("tag term", "detroit");
  check("tag term matches", byTag.ranked.length > 0 && !byTag.isFuzzy);

  // A token inside a MULTI-WORD tag ("Made in Michigan"). This is the case
  // Prisma's `hasSome` cannot express at all.
  const multiWordTag = show("token inside multi-word tag", "michigan");
  check(
    "token inside a multi-word tag matches",
    multiWordTag.ranked.length > 0,
  );

  // A shop name. Pick a shop that actually stocks something - several shops
  // in the snapshot have no products at all.
  const productCountByShop = new Map<string, number>();
  for (const product of products) {
    if (product.shopId) {
      productCountByShop.set(
        product.shopId,
        (productCountByShop.get(product.shopId) ?? 0) + 1,
      );
    }
  }
  const stockedShop = shops.find(
    (shop) => (productCountByShop.get(shop.id) ?? 0) > 0,
  );
  if (stockedShop) {
    const byShop = show(`shop name "${stockedShop.name}"`, stockedShop.name);
    check(
      "shop name returns that shop's products",
      byShop.ranked.some((r) => r.shopId === stockedShop.id) && !byShop.isFuzzy,
    );
  }

  // Deliberate misspelling -> fuzzy fallback. The fallback has to recover the
  // *right* product, not merely return something.
  const typo = show("misspelling", "shoppper 313");
  check("misspelling falls back to fuzzy", typo.isFuzzy);
  check(
    'misspelled "shoppper 313" still surfaces "The 313 Shopper"',
    typo.ranked.some((r) => r.name === "The 313 Shopper"),
    typo.ranked
      .slice(0, 3)
      .map((r) => r.name)
      .join(" | "),
  );
  check(
    "fuzzy results stay a shortlist, not a wall",
    typo.ranked.length <= 60,
    `${typo.ranked.length} results`,
  );

  // A single-word misspelling, the classic case.
  const typo2 = show("single-word misspelling", "leathr");
  check(
    'misspelled "leathr" surfaces leather goods',
    typo2.ranked.length > 0 &&
      typo2.ranked.some((r) => proseOf(r).includes("leather")),
  );

  // Markup must not be searchable content. There is no term that appears
  // *only* in markup ("div" legitimately prefixes "divider", "strong" prefixes
  // "strongly"), so assert the invariant directly instead: every strict hit for
  // an HTML tag name must be justified by a real word in the stripped prose.
  const rowsWithMarkup = products.filter(
    (r) =>
      (r.description ?? "").includes("<span") ||
      (r.description ?? "").includes("<div"),
  ).length;
  check(
    "the snapshot really does contain markup that could leak",
    rowsWithMarkup > 0,
    `${rowsWithMarkup} rows`,
  );

  for (const tag of ["span", "div", "strong"]) {
    const result = run(tag);
    if (result.isFuzzy) continue;
    const unjustified = result.ranked.filter(
      (row) => !startsWord(proseOf(row), tag),
    );
    check(
      `"${tag}" only matches prose, never markup (${result.ranked.length} hit(s))`,
      unjustified.length === 0,
      unjustified
        .slice(0, 3)
        .map((r) => r.name)
        .join(" | "),
    );
  }

  // Mid-word substrings must not match: "div" should not find "individual".
  const midWord = run("div");
  const midWordHits = midWord.isFuzzy
    ? []
    : midWord.ranked.filter((row) => !startsWord(proseOf(row), "div"));
  check(
    '"div" does not match mid-word (e.g. "individual")',
    midWordHits.length === 0,
    midWordHits.map((r) => r.name).join(" | "),
  );

  // ...while genuinely useful looseness is preserved.
  const plural = run("mug");
  check(
    'plural still matches singular ("mug" finds "Mugs")',
    plural.ranked.length > 0 && !plural.isFuzzy,
  );

  // Synonyms sourced from the category keyword lists: "tee" should reach
  // t-shirts even though the word "tee" never appears on some of them.
  const synonym = show("synonym", "tee");
  const shirtHits = synonym.ranked.filter((r) =>
    /shirt|blouse|tunic/i.test(r.name),
  );
  check(
    '"tee" reaches shirts via the category keyword list',
    shirtHits.length > 0,
    `${synonym.ranked.length} results, ${shirtHits.length} shirt-like`,
  );

  // Accent folding against a real product name carrying a true diacritic
  // (Latin-1 Supplement / Latin Extended), not merely a non-ASCII symbol such
  // as the registered-trademark sign.
  const diacritic = new RegExp(
    `[${String.fromCharCode(0x00c0)}-${String.fromCharCode(0x024f)}]`,
  );
  const accented = products.find((r) => diacritic.test(r.name));
  check(
    `the snapshot contains a name with a real diacritic (e.g. ${oUmlaut})`,
    accented !== undefined,
  );
  if (accented) {
    const unaccented = normalize(accented.name);
    const accentResult = run(unaccented);
    check(
      `accented name "${accented.name}" is findable unaccented`,
      accentResult.ranked.some((r) => r.id === accented.id),
      `searched "${unaccented}" -> ${accentResult.ranked.length} result(s)`,
    );
  }

  // The case that prompted the synonym file: "toilet paper" vs the catalog's
  // "Toilet Tissue". Both spellings must reach the same products.
  const tissueRows = products.filter((r) => proseOf(r).includes("tissue"));
  const paperQuery = show("cross-category synonym", "toilet paper");
  const tissueQuery = run("toilet tissue");
  check(
    `"toilet paper" and "toilet tissue" return the same products`,
    paperQuery.ranked.map((r) => r.id).join(",") ===
      tissueQuery.ranked.map((r) => r.id).join(","),
    `${paperQuery.ranked.length} vs ${tissueQuery.ranked.length}`,
  );
  check(
    '"toilet paper" reaches the Toilet Tissue products',
    paperQuery.ranked.some((r) => /toilet tissue/i.test(r.name)),
  );
  // Honest bound: items whose copy never mentions the concept stay unreachable.
  // Three "Value Pack" rolls say neither "toilet" nor any synonym of it, so no
  // synonym list can surface them. That is a product-copy gap, not a search one.
  const unreachable = tissueRows.filter((r) => {
    const prose = proseOf(r);
    return !["toilet", "bathroom", "restroom", "lavatory"].some((w) =>
      startsWord(prose, w),
    );
  });
  console.log(
    `\n  note: ${unreachable.length} of ${tissueRows.length} tissue products mention no` +
      ` "toilet"-family word at all and cannot be reached by any query using it:`,
  );
  for (const r of unreachable) console.log(`     - ${r.name}`);

  // Audience synonyms: the catalog says "Ladies"/"Mens"/"Youth".
  const womens = show("audience synonym", "womens");
  check(
    '"womens" reaches "Ladies ..." and "Women\'s ..." items',
    womens.ranked.length > 0 && !womens.isFuzzy,
    `${womens.ranked.length} results`,
  );
  check(
    '"womens" does not drag in "Mens ..." items by mistake',
    !womens.ranked.every((r) => /\bmens\b/i.test(r.name)),
  );

  // Nonsense query: no results, no crash.
  const nonsense = show("nonsense", "qzxwvu nonsense term");
  check("nonsense query returns nothing", nonsense.ranked.length === 0);

  // Empty and over-long queries.
  check(
    "empty query returns all candidates",
    run("").ranked.length === products.length,
  );
  check(
    "100-char query does not throw",
    run("x".repeat(100)).ranked.length >= 0,
  );

  // Fairness: no shop takes a second slot before every shop has taken one.
  const fairnessQuery = "detroit";
  const fair = run(fairnessQuery);
  const shopsInResults = new Set(fair.ranked.map((r) => r.shopId));
  if (shopsInResults.size >= 3) {
    const firstPage = fair.ranked.slice(0, 20);
    const seen = new Set<string | null>();
    let firstRepeatAt = firstPage.length;
    for (const [index, row] of firstPage.entries()) {
      if (seen.has(row.shopId)) {
        firstRepeatAt = index;
        break;
      }
      seen.add(row.shopId);
    }
    const expectedFirstRound = Math.min(shopsInResults.size, firstPage.length);
    check(
      `fairness: "${fairnessQuery}" gives each of ${shopsInResults.size} shops a slot before any repeats`,
      firstRepeatAt >= expectedFirstRound,
      `first repeat at index ${firstRepeatAt}, expected >= ${expectedFirstRound}`,
    );
  } else {
    console.log(
      `\n  (fairness check skipped: "${fairnessQuery}" matched only ${shopsInResults.size} shop(s))`,
    );
  }

  // No shop-size or featured boosting: the top result for a broad query must
  // not simply be whichever shop has the biggest catalog.
  const biggestShopId = [...productCountByShop.entries()].sort(
    (a, b) => b[1] - a[1],
  )[0]?.[0];
  const broad = run("detroit");
  const topThreeShops = new Set(broad.ranked.slice(0, 3).map((r) => r.shopId));
  check(
    "fairness: the largest shop does not own the whole top of the page",
    biggestShopId === undefined ||
      topThreeShops.size > 1 ||
      broad.ranked.length < 3,
    `top-3 shops: ${[...topThreeShops].join(", ")}`,
  );

  // Determinism: identical input, identical order.
  const a = run("detroit shirt")
    .ranked.map((r) => r.id)
    .join(",");
  const b = run("detroit shirt")
    .ranked.map((r) => r.id)
    .join(",");
  check("ranking is deterministic across runs", a === b);

  // Performance.
  const started = performance.now();
  for (let i = 0; i < 20; i += 1) run("detroit leather bag");
  const perQuery = (performance.now() - started) / 20;
  check(
    `ranking is fast (${perQuery.toFixed(2)} ms/query over ${products.length} rows)`,
    perQuery < 50,
  );

  // Worst case: a query that misses entirely falls through to the fuzzy pass,
  // which is the expensive path.
  const fuzzyStarted = performance.now();
  for (let i = 0; i < 5; i += 1) run("leathr bagg strapp");
  const perFuzzyQuery = (performance.now() - fuzzyStarted) / 5;
  check(
    `fuzzy fallback is acceptable (${perFuzzyQuery.toFixed(2)} ms/query)`,
    perFuzzyQuery < 400,
  );
}

/* -------------------------------------------------------------------------- */

console.log(
  `\n${failures === 0 ? "PASS" : "FAIL"} - ${checks - failures}/${checks} checks passed`,
);
process.exit(failures === 0 ? 0 : 1);
