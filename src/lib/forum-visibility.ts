import type { Prisma } from "generated/prisma";

/**
 * Prisma where-fragment for the communities a viewer may see in lists:
 * public communities, plus private ones the viewer created or is subscribed
 * to. Pass no userId for logged-out viewers.
 */
export function visibleSubredditsWhere(
  userId?: string | null,
): Prisma.SubredditWhereInput {
  return {
    OR: [
      { isPublic: true },
      ...(userId
        ? [{ creatorId: userId }, { subscribers: { some: { userId } } }]
        : []),
    ],
  };
}

/**
 * Prisma where-fragment for the posts a viewer may see: posts from public
 * communities, plus posts from private communities the viewer created or
 * is subscribed to. Pass no userId for logged-out viewers.
 */
export function visiblePostsWhere(
  userId?: string | null,
): Prisma.PostWhereInput {
  return { subreddit: visibleSubredditsWhere(userId) };
}
