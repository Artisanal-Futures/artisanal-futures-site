import { INFINITE_SCROLL_PAGINATION_RESULTS } from "~/config";
import { db } from "~/server/db";

import { SubredditFeed } from "../subreddit-feed";

export const GeneralSubredditFeed = async () => {
  const subreddits = await db.subreddit.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      creator: true,
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
