/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
import { notFound } from "next/navigation";
import { INFINITE_SCROLL_PAGINATION_RESULTS } from "~/config";

import { getSession } from "~/server/better-auth/server";
import { db } from "~/server/db";
import { MiniCreatePost } from "~/app/forums/_components/mini-create-post";
import { PostFeed } from "~/app/forums/_components/post-feed";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

const page = async ({ params }: Props) => {
  const { slug } = await params;

  const session = await getSession();

  const subreddit = await db.subreddit.findFirst({
    where: { name: slug },
    include: {
      subscribers: true,
      posts: {
        include: {
          author: true,
          votes: true,
          comments: true,
          subreddit: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: INFINITE_SCROLL_PAGINATION_RESULTS,
      },
    },
  });

  const showPosts =
    subreddit?.isPublic ||
    subreddit?.subscribers?.some((sub) => sub.userId === session?.user?.id) ||
    subreddit?.creatorId === session?.user?.id;

  if (!subreddit) return notFound();

  return (
    <>
      <div className="mb-2 flex items-center gap-4">
        <div className="bg-secondary text-foreground flex size-14 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold uppercase">
          {subreddit.name.charAt(0)}
        </div>
        <div className="space-y-0.5">
          <h1 className="text-foreground text-3xl font-bold tracking-tight md:text-4xl">
            r/{subreddit.name}
          </h1>
          <p className="text-muted-foreground text-sm">
            {subreddit.subscribers.length}{" "}
            {subreddit.subscribers.length === 1 ? "member" : "members"}
          </p>
        </div>
      </div>
      {showPosts && (
        <>
          <MiniCreatePost session={session} />
          <PostFeed
            initialPosts={subreddit.posts}
            subredditName={subreddit.name}
          />
        </>
      )}
      {!showPosts && (
        <div className="flex h-full flex-col items-center justify-center">
          <p className="text-lg font-semibold">
            This subreddit is private. Join the community to see posts.
          </p>
        </div>
      )}
    </>
  );
};

export default page;
