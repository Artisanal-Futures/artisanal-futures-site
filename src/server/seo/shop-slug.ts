import type { PrismaClient } from "../../../generated/prisma";
import { slugify } from "~/lib/utils";

/** Path segments under /shops that a shop slug must never shadow. */
export const RESERVED_SLUGS = new Set(["in", "tag", "new"]);

/**
 * A slug for `name` that no other shop uses, as its current or a previous
 * slug: "kente-collective", then "kente-collective-2", "-3", ...
 */
export async function generateUniqueShopSlug(
  db: Pick<PrismaClient, "shop">,
  name: string,
  excludeShopId?: string,
) {
  const base = slugify(name) || "shop";

  for (let n = 1; ; n++) {
    const candidate = n === 1 ? base : `${base}-${n}`;
    if (RESERVED_SLUGS.has(candidate)) continue;

    const taken = await db.shop.findFirst({
      where: {
        OR: [{ slug: candidate }, { previousSlugs: { has: candidate } }],
        ...(excludeShopId ? { NOT: { id: excludeShopId } } : {}),
      },
      select: { id: true },
    });
    if (!taken) return candidate;
  }
}
