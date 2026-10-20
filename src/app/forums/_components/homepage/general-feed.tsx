import { INFINITE_SCROLL_PAGINATION_RESULTS } from "~/config";
import { visiblePostsWhere } from "~/lib/forum-visibility";
import { publicUserSelect } from "~/lib/public-user";
import { getSession } from "~/server/better-auth/server";
import { db } from "~/server/db";

import { PostFeed } from "../post-feed";

export const GeneralFeed = async () => {
  const session = await getSession();

  const posts = await db.post.findMany({
    where: visiblePostsWhere(session?.user.id),
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    include: {
      votes: true,
      author: { select: publicUserSelect },
      comments: true,
      subreddit: true,
    },
    take: INFINITE_SCROLL_PAGINATION_RESULTS, // 4 to demonstrate infinite scroll, should be higher in production
  });

  return <PostFeed initialPosts={posts} />;
};
