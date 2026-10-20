import type { Prisma, PrismaClient } from "generated/prisma";
import { TRPCError } from "@trpc/server";

/**
 * Who may see a forum community's content (posts, comments, votes).
 *
 * A viewer can see a community if it is public, if they created it, or if
 * they are subscribed to it. The rule lives here once so the tRPC routers and
 * the server-rendered forum pages can't drift apart.
 *
 * Takes the Prisma client as an argument so it works with both `ctx.db` in a
 * router and `db` from `~/server/db` in a server component.
 */

type ForumDb = Pick<PrismaClient, "post" | "forumComment" | "subscription">;

/** The subreddit fields the access rule needs. */
export const subredditAccessSelect = {
  id: true,
  name: true,
  isPublic: true,
  creatorId: true,
} satisfies Prisma.SubredditSelect;

export type SubredditAccess = Prisma.SubredditGetPayload<{
  select: typeof subredditAccessSelect;
}>;

/**
 * Whether `userId` (or a logged-out viewer, when it's missing) may view the
 * community's content. Only queries Subscription when the cheaper checks
 * don't already decide it.
 */
export async function canViewSubreddit(
  db: ForumDb,
  subreddit: Pick<SubredditAccess, "id" | "isPublic" | "creatorId">,
  userId?: string | null,
): Promise<boolean> {
  if (subreddit.isPublic) return true;
  if (!userId) return false;
  if (subreddit.creatorId === userId) return true;

  const subscription = await db.subscription.findUnique({
    where: {
      userId_subredditId: { userId, subredditId: subreddit.id },
    },
    select: { userId: true },
  });

  return !!subscription;
}

/** `canViewSubreddit` for tRPC procedures: throws FORBIDDEN on failure. */
export async function assertCanViewSubreddit(
  db: ForumDb,
  subreddit: Pick<SubredditAccess, "id" | "isPublic" | "creatorId">,
  userId?: string | null,
): Promise<void> {
  if (!(await canViewSubreddit(db, subreddit, userId))) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "This community is private",
    });
  }
}

/**
 * Loads a post's community and checks the viewer may see it. Throws
 * NOT_FOUND if the post doesn't exist, FORBIDDEN if the viewer has no access.
 * Returns the post's community.
 */
export async function assertCanViewPost(
  db: ForumDb,
  postId: string,
  userId?: string | null,
): Promise<SubredditAccess> {
  const post = await db.post.findUnique({
    where: { id: postId },
    select: { subreddit: { select: subredditAccessSelect } },
  });

  if (!post) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Post not found",
    });
  }

  await assertCanViewSubreddit(db, post.subreddit, userId);

  return post.subreddit;
}

/**
 * Resolves a comment to its post and community and checks the viewer may see
 * it. Throws NOT_FOUND if the comment doesn't exist, FORBIDDEN if the viewer
 * has no access. Returns the comment's post id.
 */
export async function assertCanViewComment(
  db: ForumDb,
  commentId: string,
  userId?: string | null,
): Promise<{ postId: string }> {
  const comment = await db.forumComment.findUnique({
    where: { id: commentId },
    select: {
      postId: true,
      post: { select: { subreddit: { select: subredditAccessSelect } } },
    },
  });

  if (!comment) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Comment not found",
    });
  }

  await assertCanViewSubreddit(db, comment.post.subreddit, userId);

  return { postId: comment.postId };
}

/**
 * Checks a new comment may be written: the viewer must be able to see the
 * post, and a reply must target a comment on that same post (otherwise a
 * reply could be attached to a comment in a community the viewer can't see).
 */
export async function assertCanCommentOnPost(
  db: ForumDb,
  input: { postId: string; replyToId?: string | null },
  userId: string,
): Promise<void> {
  await assertCanViewPost(db, input.postId, userId);

  if (input.replyToId) {
    const parent = await db.forumComment.findUnique({
      where: { id: input.replyToId },
      select: { postId: true },
    });

    if (parent?.postId !== input.postId) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Comment not found",
      });
    }
  }
}
