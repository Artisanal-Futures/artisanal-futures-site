/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
import { notFound } from "next/navigation";
import { INFINITE_SCROLL_PAGINATION_RESULTS } from "~/config";
import { getServerAuthSession } from "~/server/auth";
import { db } from "~/server/db";

import { MiniCreatePost } from "~/app/forums/_components/mini-create-post";
import { PostFeed } from "~/app/forums/_components/post-feed";

type Props = {
  params: {
    slug: string;
  };
};

const page = async ({ params }: Props) => {
  const { slug } = params;

  const session = await getServerAuthSession();

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
      <h1 className="h-14 text-3xl font-bold md:text-4xl">
        r/{subreddit.name}
      </h1>
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
