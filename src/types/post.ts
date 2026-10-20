import type {
  ForumComment,
  Post,
  Subreddit,
  Vote,
} from "generated/prisma";

import type { PublicUser } from "~/lib/public-user";

export type ExtendedPost = Post & {
  subreddit: Subreddit;
  votes: Vote[];
  author: PublicUser;
  comments: ForumComment[];
};

export type ExtendedSubreddit = Subreddit & {
  creator: PublicUser | null;
  _count: {
    posts: number;
    subscribers: number;
  };
};
