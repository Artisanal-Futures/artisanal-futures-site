/**
 * Network-free, database-free tests for src/server/lib/product-sync.ts.
 *
 * This repo has no wired-up test framework (the `test` script's `jest` is
 * vestigial — jest isn't installed), so this follows the same convention as
 * scripts/test-safe-fetch.ts and scripts/test-partner-auth.ts: a plain `tsx`
 * script printing ok/FAIL lines and exiting non-zero on failure.
 *
 *   pnpm test:sync
 *
 * `planShopSync` reaches the network via `fetchStoreFeed` and the database via
 * Prisma. Both are replaced here — the feed through the `fetchFeed` seam, the
 * database with an in-memory fake implementing only the handful of delegate
 * methods the planner calls. That keeps every assertion below about the
 * planner's *decisions*, which is where the risk lives: matching legacy rows
 * without blowing up into duplicates, honouring human edits, and refusing to
 * act on a feed that looks broken.
 */
import {
  applicableDiff,
  buildDiff,
  buildMatchIndex,
  matchIncoming,
  MIN_FEED_RATIO,
  normalizeNameKey,
  normalizeUrlKey,
  planShopSync,
  resolveShopLogo,
  runScheduledSync,
  SYNCED_FIELDS,
  toFetchablePlatform,
} from "../src/server/lib/product-sync";

let failures = 0;
let passes = 0;

function ok(label: string) {
  passes++;
  console.log(`  ok - ${label}`);
}

function fail(label: string, detail?: unknown) {
  failures++;
  console.error(`  FAIL - ${label}`);
  if (detail !== undefined) console.error("   ", detail);
}

function assertEqual(label: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) ok(label);
  else fail(label, `expected ${e}, got ${a}`);
}

function assertTrue(label: string, value: boolean, detail?: unknown) {
  if (value) ok(label);
  else fail(label, detail);
}

function section(title: string) {
  console.log(`\n${title}`);
}

// --- In-memory Prisma stand-in ----------------------------------------------

type FakeProduct = {
  id: string;
  shopProductId: string | null;
  name: string;
  description: string;
  priceInCents: number | null;
  currency: string | null;
  imageUrl: string | null;
  productUrl: string | null;
  isPublic: boolean;
  manualFields: string[];
  scrapeMethod: string;
};

type FakeShop = {
  id: string;
  name: string;
  website: string | null;
  syncUrl: string | null;
  syncPlatform: string | null;
  syncEnabled: boolean;
  allowInsecureOrigin: boolean;
  logoPhoto: string | null;
};

type CapturedProposal = {
  runId: string;
  productId: string | null;
  shopProductId: string;
  changeType: string;
  matchedBy: string | null;
  payload: Record<string, unknown>;
  diff: Array<{ field: string; protected: boolean }>;
};

function makeDb(shop: FakeShop, products: FakeProduct[]) {
  const runs = new Map<string, Record<string, unknown>>();
  const proposals: CapturedProposal[] = [];
  let runSeq = 0;
  let pendingRun: { id: string } | null = null;
  const shopUpdates: Record<string, unknown>[] = [];

  const db = {
    shop: {
      findUnique: () => Promise.resolve(shop),
      update: ({ data }: { data: Record<string, unknown> }) => {
        shopUpdates.push(data);
        return Promise.resolve(shop);
      },
    },
    productSyncRun: {
      findFirst: () => Promise.resolve(pendingRun),
      create: ({ data }: { data: Record<string, unknown> }) => {
        const id = `run-${++runSeq}`;
        runs.set(id, { id, ...data });
        return Promise.resolve({ id });
      },
      update: ({
        where,
        data,
      }: {
        where: { id: string };
        data: Record<string, unknown>;
      }) => {
        runs.set(where.id, { ...runs.get(where.id), ...data });
        return Promise.resolve(runs.get(where.id));
      },
    },
    product: {
      findMany: () =>
        Promise.resolve(products.filter((p) => p.scrapeMethod !== "MANUAL")),
    },
    productSyncProposal: {
      createMany: ({ data }: { data: CapturedProposal[] }) => {
        proposals.push(...data);
        return Promise.resolve({ count: data.length });
      },
    },
  };

  return {
    // The planner only touches the delegates stubbed above; the cast keeps the
    // production signature honest without pulling in a real PrismaClient.
    db: db as unknown as Parameters<typeof planShopSync>[0],
    proposals,
    runs,
    shopUpdates,
    setPendingRun: (r: { id: string } | null) => (pendingRun = r),
  };
}

/** A minimal Shopify feed entry — `body_html` is the parser's marker key. */
function shopifyProduct(opts: {
  id: number | string;
  title: string;
  handle: string;
  body?: string;
  price?: string;
  image?: string;
}) {
  return {
    id: opts.id,
    title: opts.title,
    handle: opts.handle,
    body_html: opts.body ?? `<p>${opts.title} description</p>`,
    variants: [{ price: opts.price ?? "10.00" }],
    images: opts.image ? [{ src: opts.image }] : [],
    tags: [],
  };
}

function shopifyFeed(products: unknown[]) {
  return () =>
    Promise.resolve({
      json: JSON.stringify({ products }),
      count: products.length,
      insecureTLSCode: null,
    });
}

const BASE_SHOP: FakeShop = {
  id: "shop-1",
  name: "Test Shop",
  website: "https://teststore.com",
  syncUrl: null,
  syncPlatform: "SHOPIFY",
  syncEnabled: true,
  allowInsecureOrigin: false,
  logoPhoto: "logo.png",
};

function makeProduct(overrides: Partial<FakeProduct>): FakeProduct {
  return {
    id: "p1",
    shopProductId: null,
    name: "Widget",
    description: "A widget",
    priceInCents: 1000,
    currency: "USD",
    imageUrl: "https://teststore.com/widget.jpg",
    productUrl: "https://teststore.com/products/widget",
    isPublic: true,
    manualFields: [],
    scrapeMethod: "SHOPIFY",
    ...overrides,
  };
}

// --- Pure helpers -----------------------------------------------------------

function testNormalizers() {
  section("URL / name normalization");

  assertEqual(
    "http and https normalize to the same key",
    normalizeUrlKey("http://shop.com/products/mug"),
    normalizeUrlKey("https://shop.com/products/mug"),
  );
  assertEqual(
    "trailing slash is ignored",
    normalizeUrlKey("https://shop.com/products/mug/"),
    normalizeUrlKey("https://shop.com/products/mug"),
  );
  assertEqual(
    "query strings are ignored",
    normalizeUrlKey("https://shop.com/products/mug?utm_source=x"),
    normalizeUrlKey("https://shop.com/products/mug"),
  );
  assertEqual(
    "www. is ignored",
    normalizeUrlKey("https://www.shop.com/products/mug"),
    normalizeUrlKey("https://shop.com/products/mug"),
  );
  assertTrue(
    "different paths do not collide",
    normalizeUrlKey("https://shop.com/products/mug") !==
      normalizeUrlKey("https://shop.com/products/cup"),
  );
  assertEqual("empty url is null", normalizeUrlKey("  "), null);
  assertEqual("null url is null", normalizeUrlKey(null), null);

  assertEqual(
    "names normalize case and whitespace",
    normalizeNameKey("  Blue   Ceramic  MUG "),
    "blue ceramic mug",
  );
  assertEqual("empty name is null", normalizeNameKey("   "), null);
}

function testPlatformMapping() {
  section("Platform mapping");
  assertEqual("SHOPIFY maps to shopify", toFetchablePlatform("SHOPIFY" as never), "shopify");
  assertEqual(
    "WORDPRESS maps to wordpress",
    toFetchablePlatform("WORDPRESS" as never),
    "wordpress",
  );
  assertEqual(
    "SQUARE is not fetchable",
    toFetchablePlatform("SQUARE" as never),
    null,
  );
  assertEqual(
    "MANUAL is not fetchable",
    toFetchablePlatform("MANUAL" as never),
    null,
  );
  assertEqual("null platform is null", toFetchablePlatform(null), null);
}

function testShopLogo() {
  section("Shop logo fallback");
  assertEqual(
    'the literal string "null" is treated as no logo',
    resolveShopLogo("null"),
    undefined,
  );
  assertEqual(
    'the literal string "undefined" is treated as no logo',
    resolveShopLogo("undefined"),
    undefined,
  );
  assertEqual("empty logo is undefined", resolveShopLogo(""), undefined);
  assertEqual(
    "absolute logo urls pass through",
    resolveShopLogo("https://cdn.example.com/logo.png"),
    "https://cdn.example.com/logo.png",
  );
  assertTrue(
    "bare filenames get the storage prefix",
    resolveShopLogo("logo.png")?.startsWith(
      "https://storage.artisanalfutures.org/shops/",
    ) ?? false,
    resolveShopLogo("logo.png"),
  );
}

function testMatching() {
  section("Match index");

  const index = buildMatchIndex([
    {
      id: "keyed",
      shopProductId: "111",
      productUrl: "https://shop.com/products/keyed",
      name: "Keyed Product",
    },
    {
      id: "legacy",
      shopProductId: null,
      productUrl: "http://shop.com/products/legacy/",
      name: "Legacy Product",
    },
    {
      id: "nameonly",
      shopProductId: null,
      productUrl: null,
      name: "Name Only Product",
    },
    // Two rows sharing a URL — a pre-existing duplicate pair.
    { id: "dupe-a", shopProductId: null, productUrl: "https://shop.com/d", name: "Dupe" },
    { id: "dupe-b", shopProductId: null, productUrl: "https://shop.com/d", name: "Dupe" },
  ]);

  assertEqual(
    "exact external id wins",
    matchIncoming(
      { shopProductId: "111", productUrl: null, name: "Renamed" },
      index,
      new Set(),
    ),
    { productId: "keyed", matchedBy: "shopProductId" },
  );

  assertEqual(
    "legacy null-keyed row matches by url across a scheme change",
    matchIncoming(
      {
        shopProductId: "222",
        productUrl: "https://shop.com/products/legacy",
        name: "Legacy Product Renamed",
      },
      index,
      new Set(),
    ),
    { productId: "legacy", matchedBy: "productUrl" },
  );

  assertEqual(
    "falls back to name when there is no url",
    matchIncoming(
      { shopProductId: "333", productUrl: null, name: "  name only PRODUCT " },
      index,
      new Set(),
    ),
    { productId: "nameonly", matchedBy: "name" },
  );

  assertEqual(
    "an ambiguous url match is refused rather than guessed",
    matchIncoming(
      { shopProductId: "444", productUrl: "https://shop.com/d", name: "Dupe" },
      index,
      new Set(),
    ),
    null,
  );

  assertEqual(
    "an already-claimed row is not matched twice",
    matchIncoming(
      { shopProductId: "111", productUrl: null, name: "Keyed Product" },
      index,
      new Set(["keyed"]),
    ),
    null,
  );

  assertEqual(
    "an unknown product matches nothing",
    matchIncoming(
      {
        shopProductId: "999",
        productUrl: "https://shop.com/products/brand-new",
        name: "Brand New",
      },
      index,
      new Set(),
    ),
    null,
  );
}

function testDiffing() {
  section("Diffing and human-edit protection");

  const existing = {
    name: "Old Name",
    description: "Old description",
    priceInCents: 1000,
    currency: "USD",
    imageUrl: "https://shop.com/old.jpg",
    productUrl: "https://shop.com/p",
    manualFields: ["description", "imageUrl"],
  };

  const diff = buildDiff(existing as never, {
    name: "New Name",
    description: "New description",
    priceInCents: 1500,
    currency: "USD",
    imageUrl: "https://shop.com/new.jpg",
    productUrl: "https://shop.com/p",
  });

  assertEqual(
    "unchanged fields produce no diff entry",
    diff.map((d) => d.field).includes("productUrl"),
    false,
  );
  assertEqual(
    "changed fields are reported",
    diff.map((d) => d.field).sort(),
    ["description", "imageUrl", "name", "priceInCents"],
  );

  const protectedFields = diff.filter((d) => d.protected).map((d) => d.field);
  assertEqual(
    "hand-edited fields are flagged as protected",
    protectedFields.sort(),
    ["description", "imageUrl"],
  );

  const applicable = applicableDiff(diff).map((d) => d.field);
  assertEqual(
    "protected fields are excluded from what gets written",
    applicable.sort(),
    ["name", "priceInCents"],
  );

  const blanking = buildDiff(existing as never, {
    name: "Old Name",
    description: "Old description",
    priceInCents: null,
    currency: null,
    imageUrl: null,
    productUrl: "https://shop.com/p",
  });
  assertEqual(
    "a feed that went quiet never proposes blanking existing data",
    blanking.length,
    0,
  );
}

// --- Planner end-to-end -----------------------------------------------------

async function testPlanCreatesAndUpdates() {
  section("planShopSync: creates, updates and no-ops");

  const existing = [
    makeProduct({
      id: "p-keyed",
      shopProductId: "1",
      name: "Keyed Mug",
      priceInCents: 1000,
      productUrl: "https://teststore.com/products/keyed-mug",
    }),
    makeProduct({
      id: "p-same",
      shopProductId: "2",
      name: "Unchanged Bowl",
      description: "Unchanged Bowl description",
      priceInCents: 2000,
      imageUrl: "https://teststore.com/bowl.jpg",
      productUrl: "https://teststore.com/products/unchanged-bowl",
    }),
  ];

  const { db, proposals } = makeDb(BASE_SHOP, existing);
  const result = await planShopSync(db, "shop-1", {
    fetchFeed: shopifyFeed([
      // price changed, everything else identical -> UPDATE
      shopifyProduct({
        id: 1,
        title: "Keyed Mug",
        handle: "keyed-mug",
        body: "A widget",
        price: "25.00",
        image: "https://teststore.com/widget.jpg",
      }),
      // identical -> no proposal
      shopifyProduct({
        id: 2,
        title: "Unchanged Bowl",
        handle: "unchanged-bowl",
        body: "Unchanged Bowl description",
        price: "20.00",
        image: "https://teststore.com/bowl.jpg",
      }),
      // brand new -> CREATE
      shopifyProduct({
        id: 3,
        title: "New Plate",
        handle: "new-plate",
        price: "30.00",
      }),
    ]),
  });

  assertEqual("run is left awaiting review", result.status, "PENDING_REVIEW");
  assertEqual("one create proposed", result.created, 1);
  assertEqual("one update proposed", result.updated, 1);
  assertEqual("nothing reported missing", result.missing, 0);
  assertEqual("fetched count reflects the feed", result.fetchedCount, 3);

  const update = proposals.find((p) => p.changeType === "UPDATE");
  assertEqual(
    "an exact id match is recorded as such",
    update?.matchedBy,
    "shopProductId",
  );
  assertEqual(
    "the price change is the proposed diff",
    update?.diff.map((d) => d.field),
    ["priceInCents"],
  );

  const create = proposals.find((p) => p.changeType === "CREATE");
  assertEqual("creates carry no local product", create?.productId, null);
  assertEqual("creates carry the external id", create?.shopProductId, "3");

  assertTrue(
    "an unchanged product produces no proposal at all",
    !proposals.some((p) => p.shopProductId === "2"),
    proposals.filter((p) => p.shopProductId === "2"),
  );
}

async function testLegacyBackfill() {
  section("planShopSync: legacy rows are adopted, not duplicated");

  const { db, proposals } = makeDb(BASE_SHOP, [
    makeProduct({
      id: "p-legacy",
      shopProductId: null, // imported before external ids were captured
      name: "Legacy Mug",
      description: "Legacy Mug description",
      priceInCents: 1000,
      imageUrl: "https://teststore.com/legacy.jpg",
      productUrl: "http://teststore.com/products/legacy-mug/",
    }),
  ]);

  const result = await planShopSync(db, "shop-1", {
    fetchFeed: shopifyFeed([
      shopifyProduct({
        id: 77,
        title: "Legacy Mug",
        handle: "legacy-mug",
        body: "Legacy Mug description",
        price: "10.00",
        image: "https://teststore.com/legacy.jpg",
      }),
    ]),
  });

  assertEqual(
    "the legacy row is updated, not re-created as a duplicate",
    { created: result.created, updated: result.updated },
    { created: 0, updated: 1 },
  );

  const proposal = proposals[0];
  assertEqual("matched via the url fallback", proposal?.matchedBy, "productUrl");
  assertEqual(
    "the proposal carries the external id to backfill",
    proposal?.shopProductId,
    "77",
  );
  assertEqual("it points at the existing row", proposal?.productId, "p-legacy");
  // The row's stored URL is the pre-migration `http://.../legacy-mug/` form.
  // It normalizes to the same key (which is why it matched at all), so the only
  // proposed change is canonicalizing the stored value.
  assertEqual(
    "the only proposed change is canonicalizing the stored url",
    proposal?.diff.map((d) => d.field),
    ["productUrl"],
  );
}

async function testMissing() {
  section("planShopSync: disappeared products");

  const { db, proposals } = makeDb(BASE_SHOP, [
    makeProduct({ id: "p-a", shopProductId: "1", name: "Still Here" }),
    makeProduct({
      id: "p-b",
      shopProductId: "2",
      name: "Gone Upstream",
      productUrl: "https://teststore.com/products/gone",
    }),
    makeProduct({
      id: "p-c",
      shopProductId: "3",
      name: "Already Hidden",
      isPublic: false,
      productUrl: "https://teststore.com/products/hidden",
    }),
    // MANUAL products are filtered out by the planner's query entirely.
    makeProduct({
      id: "p-manual",
      shopProductId: "af-manual",
      name: "Hand Made Entry",
      scrapeMethod: "MANUAL",
      productUrl: "https://teststore.com/products/manual",
    }),
  ]);

  const result = await planShopSync(db, "shop-1", {
    fetchFeed: shopifyFeed([
      shopifyProduct({
        id: 1,
        title: "Still Here",
        handle: "still-here",
        body: "A widget",
        price: "10.00",
        image: "https://teststore.com/widget.jpg",
      }),
    ]),
  });

  assertEqual("the vanished product is proposed as missing", result.missing, 1);
  const missing = proposals.filter((p) => p.changeType === "MISSING");
  assertEqual("only the live vanished row", missing.map((p) => p.productId), [
    "p-b",
  ]);
  assertTrue(
    "an already-hidden product is not proposed again",
    !missing.some((p) => p.productId === "p-c"),
  );
  assertTrue(
    "a MANUAL product is never proposed as missing",
    !missing.some((p) => p.productId === "p-manual"),
  );
}

async function testHiddenProductReturns() {
  section("planShopSync: a product that came back upstream");

  const { db, proposals } = makeDb(BASE_SHOP, [
    makeProduct({
      id: "p-back",
      shopProductId: "5",
      name: "Seasonal Scarf",
      description: "Seasonal Scarf description",
      priceInCents: 1000,
      imageUrl: "https://teststore.com/scarf.jpg",
      productUrl: "https://teststore.com/products/seasonal-scarf",
      isPublic: false, // hidden by an earlier sync
    }),
  ]);

  const result = await planShopSync(db, "shop-1", {
    fetchFeed: shopifyFeed([
      shopifyProduct({
        id: 5,
        title: "Seasonal Scarf",
        handle: "seasonal-scarf",
        body: "Seasonal Scarf description",
        price: "10.00",
        image: "https://teststore.com/scarf.jpg",
      }),
    ]),
  });

  assertEqual(
    "a returning product is proposed for update so it can be unhidden",
    result.updated,
    1,
  );
  assertEqual("and not proposed as missing", result.missing, 0);
  assertEqual("it targets the hidden row", proposals[0]?.productId, "p-back");

  // A product an admin hid on purpose carries "isPublic" in manualFields, and
  // must not be resurrected just because it is still on the storefront.
  const deliberate = makeDb(BASE_SHOP, [
    makeProduct({
      id: "p-hidden-on-purpose",
      shopProductId: "6",
      name: "Withdrawn Item",
      description: "Withdrawn Item description",
      priceInCents: 1000,
      imageUrl: "https://teststore.com/withdrawn.jpg",
      productUrl: "https://teststore.com/products/withdrawn-item",
      isPublic: false,
      manualFields: ["isPublic"],
    }),
  ]);

  const deliberateResult = await planShopSync(deliberate.db, "shop-1", {
    fetchFeed: shopifyFeed([
      shopifyProduct({
        id: 6,
        title: "Withdrawn Item",
        handle: "withdrawn-item",
        body: "Withdrawn Item description",
        price: "10.00",
        image: "https://teststore.com/withdrawn.jpg",
      }),
    ]),
  });

  assertEqual(
    "a deliberately hidden product is not proposed for unhiding",
    { updated: deliberateResult.updated, missing: deliberateResult.missing },
    { updated: 0, missing: 0 },
  );
  assertEqual(
    "so the run has nothing to review",
    deliberateResult.status,
    "EMPTY",
  );
}

async function testProtectedFieldsEndToEnd() {
  section("planShopSync: hand-edited fields survive");

  const { db, proposals } = makeDb(BASE_SHOP, [
    makeProduct({
      id: "p-curated",
      shopProductId: "9",
      name: "Curated Mug",
      description: "A carefully written AF description",
      priceInCents: 1000,
      imageUrl: "https://storage.artisanalfutures.org/products/nice-photo.jpg",
      productUrl: "https://teststore.com/products/curated-mug",
      manualFields: ["description", "imageUrl"],
    }),
  ]);

  await planShopSync(db, "shop-1", {
    fetchFeed: shopifyFeed([
      shopifyProduct({
        id: 9,
        title: "Curated Mug",
        handle: "curated-mug",
        body: "Bland upstream description",
        price: "50.00",
        image: "https://teststore.com/bland.jpg",
      }),
    ]),
  });

  const diff = proposals[0]?.diff ?? [];
  const unprotected = diff.filter((d) => !d.protected).map((d) => d.field);
  assertEqual(
    "only the untouched field is proposed for writing",
    unprotected,
    ["priceInCents"],
  );
  const protectedFields = diff.filter((d) => d.protected).map((d) => d.field);
  assertEqual(
    "the hand-edited fields are shown but marked protected",
    protectedFields.sort(),
    ["description", "imageUrl"],
  );
}

async function testSafetyGuards() {
  section("planShopSync: safety guards");

  // An empty feed against a live catalog.
  {
    const { db, proposals } = makeDb(BASE_SHOP, [
      makeProduct({ id: "p-1", shopProductId: "1" }),
      makeProduct({ id: "p-2", shopProductId: "2" }),
    ]);
    const result = await planShopSync(db, "shop-1", {
      fetchFeed: shopifyFeed([]),
    });
    assertEqual("an empty feed fails the run", result.status, "FAILED");
    assertEqual("and proposes nothing at all", proposals.length, 0);
    assertTrue(
      "the failure explains itself",
      /no products/i.test(result.errorMessage ?? ""),
      result.errorMessage,
    );
  }

  // A feed that lost more than half the catalog.
  {
    const existing = Array.from({ length: 10 }, (_, i) =>
      makeProduct({
        id: `p-${i}`,
        shopProductId: String(i),
        name: `Product ${i}`,
        productUrl: `https://teststore.com/products/p${i}`,
      }),
    );
    const { db, proposals } = makeDb(BASE_SHOP, existing);
    const result = await planShopSync(db, "shop-1", {
      fetchFeed: shopifyFeed([
        shopifyProduct({ id: 0, title: "Product 0", handle: "p0" }),
        shopifyProduct({ id: 1, title: "Product 1", handle: "p1" }),
        shopifyProduct({ id: 2, title: "Product 2", handle: "p2" }),
        shopifyProduct({ id: 3, title: "Product 3", handle: "p3" }),
      ]),
    });
    assertEqual(
      `a feed below ${MIN_FEED_RATIO * 100}% of the live catalog fails the run`,
      result.status,
      "FAILED",
    );
    assertEqual("and proposes nothing at all", proposals.length, 0);
  }

  // Just above the threshold: allowed through.
  {
    const existing = Array.from({ length: 10 }, (_, i) =>
      makeProduct({
        id: `p-${i}`,
        shopProductId: String(i),
        name: `Product ${i}`,
        productUrl: `https://teststore.com/products/p${i}`,
      }),
    );
    const { db } = makeDb(BASE_SHOP, existing);
    const result = await planShopSync(db, "shop-1", {
      fetchFeed: shopifyFeed(
        Array.from({ length: 6 }, (_, i) =>
          shopifyProduct({
            id: i,
            title: `Product ${i}`,
            handle: `p${i}`,
          }),
        ),
      ),
    });
    assertEqual(
      "a feed above the threshold is planned normally",
      result.status,
      "PENDING_REVIEW",
    );
    assertEqual("and does propose the genuine removals", result.missing, 4);
  }

  // A brand-new shop with nothing live yet must not be blocked by the ratio.
  {
    const { db } = makeDb(BASE_SHOP, []);
    const result = await planShopSync(db, "shop-1", {
      fetchFeed: shopifyFeed([
        shopifyProduct({ id: 1, title: "First", handle: "first" }),
      ]),
    });
    assertEqual(
      "an empty catalog still accepts its first import",
      result.status,
      "PENDING_REVIEW",
    );
    assertEqual("as a create", result.created, 1);
  }
}

async function testConfigGuards() {
  section("planShopSync: configuration guards");

  {
    const { db } = makeDb({ ...BASE_SHOP, syncEnabled: false }, []);
    try {
      await planShopSync(db, "shop-1", { fetchFeed: shopifyFeed([]) });
      fail("a sync-disabled shop is refused");
    } catch (err) {
      assertTrue(
        "a sync-disabled shop is refused",
        /not enabled/i.test((err as Error).message),
        (err as Error).message,
      );
    }
  }

  {
    const { db } = makeDb({ ...BASE_SHOP, syncPlatform: "SQUARE" }, []);
    try {
      await planShopSync(db, "shop-1", { fetchFeed: shopifyFeed([]) });
      fail("a Square shop is refused");
    } catch (err) {
      assertTrue(
        "a Square shop is refused as not automatically syncable",
        /syncable/i.test((err as Error).message),
        (err as Error).message,
      );
    }
  }

  {
    const { db } = makeDb({ ...BASE_SHOP, website: null, syncUrl: null }, []);
    try {
      await planShopSync(db, "shop-1", { fetchFeed: shopifyFeed([]) });
      fail("a shop with no URL is refused");
    } catch (err) {
      assertTrue(
        "a shop with no store URL is refused",
        /no store url/i.test((err as Error).message),
        (err as Error).message,
      );
    }
  }

  {
    const fake = makeDb(BASE_SHOP, []);
    fake.setPendingRun({ id: "run-existing" });
    try {
      await planShopSync(fake.db, "shop-1", { fetchFeed: shopifyFeed([]) });
      fail("a shop with a pending run is refused");
    } catch (err) {
      assertTrue(
        "a shop already awaiting review is not queued again",
        /waiting for review/i.test((err as Error).message),
        (err as Error).message,
      );
    }
  }
}

async function testCuratedDataNeverProposed() {
  section("Curated data is never part of a proposal");

  const { db, proposals } = makeDb(BASE_SHOP, [
    makeProduct({ id: "p-1", shopProductId: "1", name: "Mug" }),
  ]);

  await planShopSync(db, "shop-1", {
    fetchFeed: shopifyFeed([
      shopifyProduct({ id: 1, title: "Renamed Mug", handle: "mug" }),
      shopifyProduct({ id: 2, title: "Second", handle: "second" }),
    ]),
  });

  const curated = [
    "categories",
    "categoryIds",
    "tags",
    "attributeTags",
    "materialTags",
    "environmentalTags",
    "aiGeneratedTags",
    "isFeatured",
  ];

  for (const proposal of proposals) {
    const payloadKeys = Object.keys(proposal.payload);
    const leaked = payloadKeys.filter((k) => curated.includes(k));
    assertEqual(
      `payload for ${proposal.shopProductId} carries no curated fields`,
      leaked,
      [],
    );
    const diffFields = proposal.diff.map((d) => d.field);
    const leakedDiff = diffFields.filter((f) => curated.includes(f));
    assertEqual(
      `diff for ${proposal.shopProductId} carries no curated fields`,
      leakedDiff,
      [],
    );
    assertTrue(
      `payload for ${proposal.shopProductId} only holds synced fields`,
      payloadKeys.every((k) => (SYNCED_FIELDS as readonly string[]).includes(k)),
      payloadKeys,
    );
  }
}

async function testSweep() {
  section("runScheduledSync: sitewide sweep");

  // A fake db covering the multi-shop shape the sweep needs. Each shop gets its
  // own product list and feed, so one broken store can be proven not to take
  // the others down with it.
  const shops = [
    { ...BASE_SHOP, id: "s-ok", name: "Working Shop" },
    { ...BASE_SHOP, id: "s-square", name: "Square Shop", syncPlatform: "SQUARE" },
    {
      ...BASE_SHOP,
      id: "s-broken",
      name: "Broken Shop",
      website: "https://broken-store.com",
    },
    {
      ...BASE_SHOP,
      id: "s-off",
      name: "Disabled Shop",
      syncEnabled: false,
    },
  ];

  const created: string[] = [];
  const runStatuses = new Map<string, string>();
  let runSeq = 0;

  const db = {
    shop: {
      // The sweep's own filter.
      findMany: ({ where }: { where: Record<string, unknown> }) =>
        Promise.resolve(
          shops.filter(
            (s) =>
              s.syncEnabled === (where.syncEnabled as boolean) &&
              s.syncPlatform !== null,
          ),
        ),
      findUnique: ({ where }: { where: { id: string } }) =>
        Promise.resolve(shops.find((s) => s.id === where.id) ?? null),
      update: () => Promise.resolve({}),
    },
    productSyncRun: {
      findFirst: () => Promise.resolve(null),
      create: ({ data }: { data: { shopId: string } }) => {
        const id = `run-${++runSeq}`;
        created.push(data.shopId);
        return Promise.resolve({ id });
      },
      update: ({
        where,
        data,
      }: {
        where: { id: string };
        data: { status?: string };
      }) => {
        if (data.status) runStatuses.set(where.id, data.status);
        return Promise.resolve({});
      },
    },
    product: { findMany: () => Promise.resolve([]) },
    productSyncProposal: {
      createMany: ({ data }: { data: unknown[] }) =>
        Promise.resolve({ count: data.length }),
    },
  } as unknown as Parameters<typeof runScheduledSync>[0];

  // The broken shop's feed throws; every other shop returns one product.
  const originalFetch = shopifyFeed([
    shopifyProduct({ id: 1, title: "Item", handle: "item" }),
  ]);

  const summary = await runScheduledSync(db, {
    triggeredManually: true,
    // The sweep calls planShopSync directly, so stub at the fetch layer by
    // routing through a per-shop feed.
    fetchFeed: (async (opts: { website: string }) => {
      if (opts.website.includes("broken")) throw new Error("store is down");
      return originalFetch();
    }) as never,
  });

  assertEqual(
    "a disabled shop is never visited",
    created.includes("s-off"),
    false,
  );
  assertTrue(
    "a Square shop is skipped without starting a run",
    !created.includes("s-square"),
    created,
  );
  assertEqual(
    "the Square shop is still reported as skipped",
    summary.results.find((r) => r.shopId === "s-square")?.status,
    "skipped",
  );
  assertTrue(
    "a broken store does not stop the sweep",
    created.includes("s-ok"),
    created,
  );
  assertEqual("the working shop is planned", summary.shopsPlanned, 1);
  assertEqual("the broken shop is counted as failed", summary.shopsFailed, 1);
  assertEqual("the disabled and Square shops are not considered", summary.shopsConsidered, 3);
}

// --- Runner -----------------------------------------------------------------

async function main() {
  console.log("product-sync tests\n==================");

  testNormalizers();
  testPlatformMapping();
  testShopLogo();
  testMatching();
  testDiffing();
  await testPlanCreatesAndUpdates();
  await testLegacyBackfill();
  await testMissing();
  await testHiddenProductReturns();
  await testProtectedFieldsEndToEnd();
  await testSafetyGuards();
  await testConfigGuards();
  await testCuratedDataNeverProposed();
  await testSweep();

  console.log(`\n${passes} passed, ${failures} failed`);
  if (failures > 0) process.exit(1);
}

void main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
