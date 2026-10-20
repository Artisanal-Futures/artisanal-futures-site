import { cache } from "react";

import { api } from "~/trpc/server";

/**
 * `generateMetadata` and the page both need the shop; `cache()` dedupes them
 * into a single query per request. Accepts a slug, a previous slug or an id.
 */
export const getShop = cache((slugOrId: string) => api.shop.get(slugOrId));
