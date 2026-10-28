import { cache } from "react";

import { db } from "~/server/db";
import { api } from "~/trpc/server";

/**
 * `generateMetadata` and the page both need the shop; `cache()` dedupes them
 * into a single query per request. Accepts a slug, a previous slug or an id.
 */
export const getShop = cache((slugOrId: string) => api.shop.get(slugOrId));

/**
 * The admin SEO overrides for a shop, read server-side only. They are kept out
 * of the public `shop.get` response, which anyone can call. Pass the id of a
 * shop `getShop` already returned, so visibility has been checked.
 */
export const getShopSeo = cache((shopId: string) =>
  db.shop.findUnique({
    where: { id: shopId },
    select: {
      seoTitle: true,
      seoDescription: true,
      seoImage: true,
      seoNoIndex: true,
    },
  }),
);
