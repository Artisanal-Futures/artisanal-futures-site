import { INFINITE_SCROLL_PAGINATION_RESULTS } from "~/config";
import { visibleSubredditsWhere } from "~/lib/forum-visibility";
import { publicUserSelect } from "~/lib/public-user";
import { getSession } from "~/server/better-auth/server";
import { db } from "~/server/db";

import { SubredditFeed } from "../subreddit-feed";

export const GeneralSubredditFeed = async () => {
  const session = await getSession();

  const subreddits = await db.subreddit.findMany({
    where: visibleSubredditsWhere(session?.user.id),
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    include: {
      creator: { select: publicUserSelect },
      _count: {
        select: {
          posts: true,
          subscribers: true,
        },
      },
    },
    take: INFINITE_SCROLL_PAGINATION_RESULTS, // 4 to demonstrate infinite scroll, should be higher in production
  });

  return <SubredditFeed initialSubreddits={subreddits} />;
};
