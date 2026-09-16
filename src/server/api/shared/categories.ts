import type { PrismaClient } from "generated/prisma";

/**
 * Shared category expansion helpers.
 *
 * Products and services both store their categories as a flat many-to-many
 * list, but the UI presents categories as a two-level tree. Whenever a child
 * category is attached we also attach its parent, so that browsing a parent
 * category surfaces everything filed underneath it. Both routers used to keep
 * their own byte-identical copy of this rule; it lives here once instead.
 */

/**
 * Expand a list of category ids with the ids of their parents.
 *
 * Returns an empty array for an empty/undefined selection so callers can hand
 * the result straight to `categories: { connect: ... }`.
 */
export const getCategoriesWithParents = async (
  db: PrismaClient,
  categoryIds: string[] | undefined,
): Promise<string[]> => {
  if (!categoryIds || categoryIds.length === 0) {
    return [];
  }

  const selectedCategories = await db.category.findMany({
    where: { id: { in: categoryIds } },
    select: { parentId: true },
  });

  const parentIds = selectedCategories
    .map((cat) => cat.parentId)
    .filter((id): id is string => id !== null);

  return [...new Set([...categoryIds, ...parentIds])];
};

/**
 * Pure counterpart of `getCategoriesWithParents` for callers that have already
 * loaded the category table (e.g. a bulk import resolving many rows at once).
 *
 * `byId` maps a category id to at least its `parentId`; ids missing from the
 * map contribute no parent. The result is deduped and preserves first-seen
 * order (selected ids first, then the parents they pulled in).
 */
export const expandWithParents = (
  ids: string[],
  byId: Map<string, { parentId: string | null }>,
): string[] => {
  const expanded = new Set<string>(ids);

  for (const id of ids) {
    const parentId = byId.get(id)?.parentId;
    if (parentId) {
      expanded.add(parentId);
    }
  }

  return [...expanded];
};
