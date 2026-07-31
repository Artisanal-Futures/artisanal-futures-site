/**
 * =============================================================================
 * scripts/docs/seed-demo.ts — dev-only demo data for the docs screenshot pipeline
 * =============================================================================
 *
 * WHAT IT DOES
 * ------------
 * Creates a small, predictable slice of demo content so documentation
 * screenshots always have something to show:
 *
 *   - 2 users, created through the real invite-gated sign-up flow:
 *       demo-admin@artisanalfutures.org    (ADMIN,   invite DOCS-DEMO-ADMIN)
 *       demo-artisan@artisanalfutures.org  (ARTISAN, invite DOCS-DEMO-ARTISAN)
 *   - 1 shop ("Demo Artisan Studio") + its ShopAddress, owned by the artisan
 *   - 3 products, 2 services, 1 upcoming event on that shop
 *   - 1 forum community ("demo-makers") + 1 welcome post by the artisan
 *   - 1 spare *unused* invite (DOCS-DEMO-SPARE) so the admin invites table
 *     is never empty in screenshots
 *
 * SAFE TO RUN REPEATEDLY
 * ----------------------
 * Every step is create-if-not-exists, keyed on a fixed identifier. The script
 * NEVER calls deleteMany, never truncates, never bulk-upserts a table, and
 * never touches a row it did not create. Re-running it is a no-op apart from
 * re-asserting the two demo users' roles.
 *
 * SAFETY GUARD
 * ------------
 * The very first thing this file does — before importing anything that could
 * open a database connection or run env validation — is parse DATABASE_URL and
 * refuse to continue unless the host is `localhost` or `127.0.0.1`. Everything
 * app-related is loaded with dynamic `await import()` *after* that check, so an
 * accidental run against staging/production exits before a single query.
 *
 * HOW TO RUN
 * ----------
 *   pnpm docs:seed
 *
 * which is:
 *
 *   tsx --env-file=.env --env-file=.env.docs scripts/docs/seed-demo.ts
 *
 * The later `--env-file` wins, so `.env.docs` overrides DATABASE_URL to point
 * at the local docker postgres. (If `docs:seed` is not yet in package.json,
 * run the raw tsx command above — it is the authoritative invocation.)
 *
 * LOCAL-ONLY CREDENTIALS
 * ----------------------
 * Both demo users share the password `process.env.DOCS_DEMO_PASSWORD`, falling
 * back to the literal `DocsDemo!Local123`. This is a throwaway credential for a
 * local docker database used to take screenshots. It is deliberately committed
 * in plaintext, it grants access to nothing outside your machine, and the host
 * guard above makes it impossible to seed it anywhere else.
 * =============================================================================
 */

import process from "node:process";

// ---------------------------------------------------------------------------
// SAFETY GUARD — must stay above every app import. Only node builtins may be
// imported statically; `~/server/db`, `~/server/better-auth` and `~/env` are
// all loaded lazily inside main() so that env validation and the Prisma client
// are never constructed for a non-local database.
// ---------------------------------------------------------------------------

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error(
    "\n[seed] FATAL: DATABASE_URL is not set.\n" +
      "[seed] This script must be run with the docs env files loaded:\n" +
      "[seed]   pnpm docs:seed\n" +
      "[seed] (tsx --env-file=.env --env-file=.env.docs scripts/docs/seed-demo.ts)\n",
  );
  process.exit(1);
}

const parsedDatabaseUrl = (() => {
  try {
    return new URL(DATABASE_URL);
  } catch {
    return null;
  }
})();

if (!parsedDatabaseUrl) {
  console.error(
    "\n[seed] FATAL: DATABASE_URL is not a parseable URL — refusing to run.\n",
  );
  process.exit(1);
}

const DATABASE_HOST = parsedDatabaseUrl.hostname;

if (!LOCAL_HOSTS.has(DATABASE_HOST)) {
  console.error(
    "\n" +
      "==============================================================\n" +
      "  [seed] REFUSING TO RUN — NON-LOCAL DATABASE\n" +
      "==============================================================\n" +
      `  DATABASE_URL host: ${DATABASE_HOST}\n` +
      "  Allowed hosts:     localhost, 127.0.0.1\n" +
      "\n" +
      "  This script writes demo data and is for local development\n" +
      "  only. Point DATABASE_URL at the local docker postgres (see\n" +
      "  .env.docs) and try again.\n" +
      "==============================================================\n",
  );
  process.exit(1);
}

// `~/env` requires NODE_ENV to be one of development|test|production, and tsx
// (unlike `next dev`) does not set it. Default it before any app import so env
// validation passes. Dev-only by construction — the host guard above already
// proved we are pointed at a local database.
if (!process.env.NODE_ENV) {
  (process.env as Record<string, string | undefined>).NODE_ENV = "development";
}

// ---------------------------------------------------------------------------
// Types (import types are erased at compile time — they load nothing at runtime)
// ---------------------------------------------------------------------------

type Db = (typeof import("~/server/db"))["db"];
type Auth = (typeof import("~/server/better-auth"))["auth"];

type DemoUserSpec = {
  email: string;
  name: string;
  role: "ADMIN" | "ARTISAN";
  code: string;
};

// ---------------------------------------------------------------------------
// Fixed demo data
// ---------------------------------------------------------------------------

const DEMO_PASSWORD = process.env.DOCS_DEMO_PASSWORD ?? "DocsDemo!Local123";

const TEN_YEARS_MS = 10 * 365 * 24 * 60 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const THREE_HOURS_MS = 3 * 60 * 60 * 1000;

const tenYearsOut = () => new Date(Date.now() + TEN_YEARS_MS);

const DEMO_USERS: DemoUserSpec[] = [
  {
    email: "demo-admin@artisanalfutures.org",
    name: "Demo Admin",
    role: "ADMIN",
    code: "DOCS-DEMO-ADMIN",
  },
  {
    email: "demo-artisan@artisanalfutures.org",
    name: "Demo Artisan",
    role: "ARTISAN",
    code: "DOCS-DEMO-ARTISAN",
  },
];

const SPARE_INVITE = {
  code: "DOCS-DEMO-SPARE",
  email: "docs-demo-spare@artisanalfutures.org",
  role: "GUEST" as const,
};

const DEMO_SHOP_NAME = "Demo Artisan Studio";

const DEMO_PRODUCTS: Array<{
  shopProductId: string;
  name: string;
  description: string;
  priceInCents: number;
  tags: string[];
  materialTags: string[];
  preferredCategories: string[];
}> = [
  {
    shopProductId: "demo-woven-basket",
    name: "Demo Woven Basket",
    description:
      "A hand-woven storage basket made from reclaimed reed and cotton cord. Sturdy enough for firewood, pretty enough for the living room.",
    priceInCents: 4800,
    tags: ["demo", "handwoven"],
    materialTags: ["Reclaimed reed", "Cotton cord"],
    preferredCategories: ["Decor", "Home & Kitchen"],
  },
  {
    shopProductId: "demo-ceramic-mug",
    name: "Demo Ceramic Mug",
    description:
      "A wheel-thrown stoneware mug with a speckled glaze. Twelve ounces, dishwasher safe, no two exactly alike.",
    priceInCents: 2400,
    tags: ["demo", "ceramics"],
    materialTags: ["Stoneware"],
    preferredCategories: ["Bar & Drinkware", "Home & Kitchen"],
  },
  {
    shopProductId: "demo-print-tote",
    name: "Demo Print Tote",
    description:
      "A screen-printed canvas tote in water-based ink, cut and sewn from deadstock fabric. Roomy enough for a farmers market run.",
    priceInCents: 3200,
    tags: ["demo", "screenprint"],
    materialTags: ["Deadstock canvas"],
    preferredCategories: ["Bags & Wallets", "Bags & Accessories"],
  },
];

const DEMO_SERVICES: Array<{
  name: string;
  description: string;
  priceInCents: number;
  durationInMinutes: number;
  locationType: string;
  tags: string[];
  preferredCategories: string[];
}> = [
  {
    name: "Demo Upcycling Consultation",
    description:
      "A one-hour session to work through what can be salvaged, rebuilt, or rethought from materials you already have on hand.",
    priceInCents: 7500,
    durationInMinutes: 60,
    locationType: "Online",
    tags: ["demo", "consultation"],
    preferredCategories: ["Consulting & Expertise", "Creative Strategy"],
  },
  {
    name: "Demo Custom Commission",
    description:
      "Commission a made-to-order piece. Includes a design conversation, a materials proposal, and two rounds of revisions.",
    priceInCents: 25000,
    durationInMinutes: 120,
    locationType: "In-Person",
    tags: ["demo", "commission"],
    preferredCategories: ["Custom & Made-to-Order", "Custom Artwork"],
  },
];

const DEMO_EVENT_TITLE = "Demo Makers Market";
const DEMO_SUBREDDIT_NAME = "demo-makers";
const DEMO_POST_TITLE = "Welcome to the demo community";

/**
 * The forum stores Post.content as a JSON *string* (the routers write
 * `JSON.stringify(...)` and `EditorOutput` reads it back with `JSON.parse`),
 * so the EditorJS document is stringified before it goes into the Json column.
 */
const DEMO_POST_CONTENT = JSON.stringify({
  time: Date.now(),
  blocks: [
    {
      type: "paragraph",
      data: {
        text: "This is a demo community used for documentation screenshots. Say hello, share what you are working on, and ask questions here.",
      },
    },
  ],
  version: "2.30.7",
});

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

/**
 * Create a demo user through the real, invite-gated sign-up path.
 *
 * The `before` hook on `/sign-up/email` (src/server/better-auth/config.tsx)
 * requires `body.code` to match an unused, unexpired PlatformInvite whose email
 * equals the sign-up email. So we mint the invite first, sign up, then burn it.
 */
async function ensureDemoUser(db: Db, auth: Auth, spec: DemoUserSpec) {
  const label = spec.role.toLowerCase();
  const existing = await db.user.findUnique({ where: { email: spec.email } });

  if (existing) {
    console.log(`[seed] ${label} user exists, skipping sign-up (${spec.email})`);
  } else {
    // (b) Mint / refresh the invite this sign-up will consume.
    await db.platformInvite.upsert({
      where: { code: spec.code },
      create: {
        code: spec.code,
        email: spec.email,
        role: spec.role,
        used: false,
        expiresAt: tenYearsOut(),
      },
      update: {
        email: spec.email,
        role: spec.role,
        used: false,
        usedAt: null,
        usedBy: null,
        expiresAt: tenYearsOut(),
      },
    });
    console.log(`[seed] invite ${spec.code} ready for ${spec.email}`);

    // (c) Sign up. `code` is validated by the before-hook; `role` is a
    // declared better-auth additionalField. Same body shape as the sanctioned
    // route at src/app/api/auth/sign-up-with-invite/route.ts.
    try {
      await auth.api.signUpEmail({
        body: {
          email: spec.email,
          password: DEMO_PASSWORD,
          name: spec.name,
          role: spec.role,
          code: spec.code,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      });
    } catch (error) {
      console.error(
        `\n[seed] FATAL: sign-up failed for ${spec.email}. No fallback was attempted.\n`,
      );
      console.error(error);
      //
      // Deliberately NO silent fallback to a raw insert — a hand-rolled User row
      // without a matching Account row cannot sign in, which would produce demo
      // credentials that quietly do not work. If this ever needs a fallback,
      // pick one explicitly:
      //
      //   1. HTTP against a running dev server (exercises the same hook):
      //        await fetch(`${env.BETTER_AUTH_URL}/api/auth/sign-up-with-invite`, {
      //          method: "POST",
      //          headers: { "Content-Type": "application/json" },
      //          body: JSON.stringify({
      //            email: spec.email,
      //            password: DEMO_PASSWORD,
      //            name: spec.name,
      //            invitationCode: spec.code,
      //          }),
      //        });
      //
      //   2. Direct insert, bypassing the hook entirely:
      //        const { hashPassword } = await import("better-auth/crypto");
      //        const user = await db.user.create({
      //          data: { email, name, role, emailVerified: true },
      //        });
      //        await db.account.create({
      //          data: {
      //            userId: user.id,
      //            providerId: "credential",
      //            accountId: user.id,
      //            password: await hashPassword(DEMO_PASSWORD),
      //          },
      //        });
      //
      process.exit(1);
    }

    const created = await db.user.findUnique({ where: { email: spec.email } });
    if (!created) {
      console.error(
        `\n[seed] FATAL: sign-up reported success but no user row exists for ${spec.email}.\n`,
      );
      process.exit(1);
    }
    console.log(`[seed] created ${label} user ${spec.email}`);

    // (d) Burn the invite.
    await db.platformInvite.update({
      where: { code: spec.code },
      data: { used: true, usedAt: new Date(), usedBy: created.id },
    });
    console.log(`[seed] marked invite ${spec.code} as used`);
  }

  // (e) Belt and braces: force the intended role either way.
  const user = await db.user.update({
    where: { email: spec.email },
    data: { role: spec.role },
  });
  console.log(`[seed] ${label} role asserted for ${spec.email}`);

  return user;
}

// ---------------------------------------------------------------------------
// Content helpers
// ---------------------------------------------------------------------------

/**
 * Find an existing category to connect to. Never creates categories — the
 * taxonomy is seeded separately (prisma/seed.ts). Returns null when the
 * category table is empty so callers can skip the connection gracefully.
 */
async function findCategoryId(
  db: Db,
  type: "PRODUCT" | "SERVICE",
  preferredNames: string[],
): Promise<string | null> {
  const preferred = await db.category.findFirst({
    where: { type, name: { in: preferredNames } },
    select: { id: true },
  });
  if (preferred) return preferred.id;

  const fallback = await db.category.findFirst({
    where: { type },
    select: { id: true },
  });
  return fallback?.id ?? null;
}

async function ensureShop(db: Db, ownerId: string) {
  const existing = await db.shop.findFirst({
    where: { name: DEMO_SHOP_NAME, ownerId },
  });

  if (existing) {
    console.log(`[seed] shop "${DEMO_SHOP_NAME}" exists, skipping`);
    return existing;
  }

  const shop = await db.shop.create({
    data: {
      name: DEMO_SHOP_NAME,
      ownerName: "Demo Artisan",
      ownerId,
      bio: "A small studio making baskets, mugs, and totes out of reclaimed and deadstock materials.",
      description:
        "Demo Artisan Studio is placeholder content used for documentation screenshots. Everything here is fictional, but the layout matches a real shop profile: a bio, a handful of products, a couple of bookable services, and an upcoming event.",
      email: "demo-artisan@artisanalfutures.org",
      phone: "313-555-0142",
      website: "https://example.com/demo-artisan-studio",
      isPublic: true,
      // ShopAddress is a separate model with a unique shopId; the app's own
      // shop.create writes it as a nested create, so we do the same.
      address: {
        create: {
          address: "1234 Demo Avenue",
          city: "Detroit",
          state: "MI",
          zip: "48201",
          country: "USA",
        },
      },
    },
  });

  console.log(`[seed] created shop "${DEMO_SHOP_NAME}" (${shop.id})`);
  return shop;
}

async function ensureProducts(db: Db, shopId: string) {
  for (const spec of DEMO_PRODUCTS) {
    const existing = await db.product.findFirst({
      where: { shopId, shopProductId: spec.shopProductId },
    });

    if (existing) {
      console.log(`[seed] product "${spec.name}" exists, skipping`);
      continue;
    }

    const categoryId = await findCategoryId(
      db,
      "PRODUCT",
      spec.preferredCategories,
    );

    await db.product.create({
      data: {
        shopId,
        shopProductId: spec.shopProductId,
        name: spec.name,
        description: spec.description,
        priceInCents: spec.priceInCents,
        currency: "USD",
        tags: spec.tags,
        materialTags: spec.materialTags,
        isPublic: true,
        scrapeMethod: "MANUAL",
        ...(categoryId ? { categories: { connect: { id: categoryId } } } : {}),
      },
    });

    console.log(
      `[seed] created product "${spec.name}"` +
        (categoryId ? "" : " (no PRODUCT categories found — skipped category)"),
    );
  }
}

async function ensureServices(db: Db, shopId: string) {
  for (const spec of DEMO_SERVICES) {
    const existing = await db.service.findFirst({
      where: { shopId, name: spec.name },
    });

    if (existing) {
      console.log(`[seed] service "${spec.name}" exists, skipping`);
      continue;
    }

    const categoryId = await findCategoryId(
      db,
      "SERVICE",
      spec.preferredCategories,
    );

    await db.service.create({
      data: {
        shopId,
        name: spec.name,
        description: spec.description,
        priceInCents: spec.priceInCents,
        currency: "USD",
        durationInMinutes: spec.durationInMinutes,
        locationType: spec.locationType,
        tags: spec.tags,
        // Service.isPublic defaults to false — opt in so it shows up.
        isPublic: true,
        ...(categoryId ? { categories: { connect: { id: categoryId } } } : {}),
      },
    });

    console.log(
      `[seed] created service "${spec.name}"` +
        (categoryId ? "" : " (no SERVICE categories found — skipped category)"),
    );
  }
}

async function ensureEvent(db: Db, shopId: string) {
  const existing = await db.event.findFirst({
    where: { shopId, title: DEMO_EVENT_TITLE },
  });

  if (existing) {
    console.log(`[seed] event "${DEMO_EVENT_TITLE}" exists, skipping`);
    return;
  }

  const startDate = new Date(Date.now() + THIRTY_DAYS_MS);

  await db.event.create({
    data: {
      shopId,
      title: DEMO_EVENT_TITLE,
      description:
        "A one-day pop-up market with a dozen local makers, live demos, and a repair table. Placeholder content for documentation screenshots.",
      startDate,
      endDate: new Date(startDate.getTime() + THREE_HOURS_MS),
      location: "Eastern Market, Detroit, MI",
      callToActionLink: "https://example.com/demo-makers-market",
    },
  });

  console.log(
    `[seed] created event "${DEMO_EVENT_TITLE}" starting ${startDate.toISOString()}`,
  );
}

async function ensureForum(db: Db, authorId: string) {
  let subreddit = await db.subreddit.findUnique({
    where: { name: DEMO_SUBREDDIT_NAME },
  });

  if (subreddit) {
    console.log(
      `[seed] community "r/${DEMO_SUBREDDIT_NAME}" exists, skipping create`,
    );
  } else {
    subreddit = await db.subreddit.create({
      data: {
        name: DEMO_SUBREDDIT_NAME,
        description:
          "A demo community for makers. Placeholder content for documentation screenshots.",
        isPublic: true,
        creatorId: authorId,
      },
    });
    console.log(`[seed] created community "r/${DEMO_SUBREDDIT_NAME}"`);
  }

  // The forum routers require the creator to be subscribed (posting is gated on
  // an existing Subscription), so mirror that invariant here.
  const subscription = await db.subscription.findUnique({
    where: {
      userId_subredditId: { userId: authorId, subredditId: subreddit.id },
    },
  });

  if (subscription) {
    console.log("[seed] creator subscription exists, skipping");
  } else {
    await db.subscription.create({
      data: { userId: authorId, subredditId: subreddit.id },
    });
    console.log(`[seed] subscribed creator to "r/${DEMO_SUBREDDIT_NAME}"`);
  }

  const existingPost = await db.post.findFirst({
    where: { subredditId: subreddit.id, title: DEMO_POST_TITLE },
  });

  if (existingPost) {
    console.log(`[seed] post "${DEMO_POST_TITLE}" exists, skipping`);
    return;
  }

  await db.post.create({
    data: {
      title: DEMO_POST_TITLE,
      content: DEMO_POST_CONTENT,
      authorId,
      subredditId: subreddit.id,
    },
  });

  console.log(`[seed] created post "${DEMO_POST_TITLE}"`);
}

async function ensureSpareInvite(db: Db) {
  const existing = await db.platformInvite.findUnique({
    where: { code: SPARE_INVITE.code },
  });

  if (existing) {
    console.log(`[seed] spare invite ${SPARE_INVITE.code} exists, skipping`);
    return;
  }

  await db.platformInvite.create({
    data: {
      code: SPARE_INVITE.code,
      email: SPARE_INVITE.email,
      role: SPARE_INVITE.role,
      used: false,
      expiresAt: tenYearsOut(),
    },
  });

  console.log(`[seed] created spare unused invite ${SPARE_INVITE.code}`);
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`[seed] target database host: ${DATABASE_HOST} (local — ok)`);

  // Dynamic imports: nothing app-related is loaded until the guard has passed.
  const { db } = await import("~/server/db");
  const { auth } = await import("~/server/better-auth");

  try {
    console.log("[seed] --- users ---");
    const users: Record<string, { id: string }> = {};
    for (const spec of DEMO_USERS) {
      const user = await ensureDemoUser(db, auth, spec);
      users[spec.role] = user;
    }

    const artisan = users.ARTISAN;
    if (!artisan) {
      console.error("\n[seed] FATAL: demo artisan user was not created.\n");
      process.exit(1);
    }

    console.log("[seed] --- shop ---");
    const shop = await ensureShop(db, artisan.id);

    console.log("[seed] --- products ---");
    await ensureProducts(db, shop.id);

    console.log("[seed] --- services ---");
    await ensureServices(db, shop.id);

    console.log("[seed] --- event ---");
    await ensureEvent(db, shop.id);

    console.log("[seed] --- forum ---");
    await ensureForum(db, artisan.id);

    console.log("[seed] --- invites ---");
    await ensureSpareInvite(db);

    console.log("[seed] done. Demo sign-in:");
    for (const spec of DEMO_USERS) {
      console.log(`[seed]   ${spec.email} / ${DEMO_PASSWORD} (${spec.role})`);
    }
  } finally {
    await db.$disconnect();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n[seed] FATAL: unhandled error\n");
    console.error(error);
    process.exit(1);
  });
