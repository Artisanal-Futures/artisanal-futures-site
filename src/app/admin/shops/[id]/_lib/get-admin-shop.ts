import { cache } from "react";
import { notFound } from "next/navigation";

import { getSession } from "~/server/better-auth/server";
import { api } from "~/trpc/server";

/**
 * Loads a shop for the admin hub and enforces access. Deduped per request so
 * the layout, every sub-page and generateMetadata share one query. Every
 * sub-page must call this itself — a layout's notFound() does not stop
 * sibling pages from rendering. `idOrSlug` may be a slug; always use the
 * returned `shop.id` for follow-up queries and links.
 */
export const getAdminShop = cache(async (idOrSlug: string) => {
  const [shop, session] = await Promise.all([
    api.shop.getForAdmin(idOrSlug),
    getSession(),
  ]);
  if (!shop) notFound();

  const userRole = session?.user.role ?? "ARTISAN";
  const isAdmin = userRole === "ADMIN";

  // `getForAdmin` already returns null for a shop the user doesn't own; keep
  // this as a second guard so access never rests on one check.
  if (!isAdmin && shop.ownerId !== session?.user.id) notFound();

  return { shop, session, userRole, isAdmin };
});
