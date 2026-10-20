"use client";

import type { FC } from "react";
import { useEffect, useRef } from "react";

import { INFINITE_SCROLL_PAGINATION_RESULTS } from "~/config";
import { Loader2, MessageSquareText } from "lucide-react";

import type { ExtendedPost } from "~/types/post";
import { authClient } from "~/server/better-auth/client";
import { api } from "~/trpc/react";
import { useIntersection } from "~/hooks/use-intersection";

import { SinglePost } from "./single-post";

type Props = {
  initialPosts: ExtendedPost[];
  subredditName?: string;
  followedOnly?: boolean;
};

export const PostFeed: FC<Props> = ({
  initialPosts,
  subredditName,
  followedOnly,
}) => {
  const lastPostRef = useRef<HTMLElement>(null);
  const { ref, entry } = useIntersection({
    root: lastPostRef.current,
    threshold: 1,
  });
  const { data: session } = authClient.useSession();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    api.forumSubreddit.getPosts.useInfiniteQuery(
      {
        limit: `${INFINITE_SCROLL_PAGINATION_RESULTS}`,
        page: "1",
        subredditName,
        followedOnly,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        // Seed with the server-rendered first page so it is not refetched
        initialData: {
          pages: [
            {
              posts: initialPosts,
              nextCursor:
                initialPosts.length >= INFINITE_SCROLL_PAGINATION_RESULTS
                  ? initialPosts[initialPosts.length - 1]?.id
                  : undefined,
            },
          ],
          pageParams: [null],
        },
        staleTime: Infinity,
      },
    );

  useEffect(() => {
    if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage(); // Load more posts when the last post comes into view
    }
  }, [entry, fetchNextPage, hasNextPage, isFetchingNextPage]);

  const posts = data?.pages?.flatMap((page) => page?.posts) ?? initialPosts;

  if (posts.length === 0) {
    return (
      <div className="border-border bg-card col-span-2 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-16 text-center">
        <div className="bg-secondary text-muted-foreground flex size-12 items-center justify-center rounded-full">
          <MessageSquareText className="h-6 w-6" />
        </div>
        <p className="text-foreground text-lg font-semibold">No posts yet</p>
        <p className="text-muted-foreground max-w-xs text-sm">
          Be the first one to start the conversation in this community.
        </p>
      </div>
    );
  }

  return (
    <ul className="col-span-2 flex flex-col space-y-6">
      {posts.map((post, index) => {
        const votesAmt = post.votes.reduce((acc, vote) => {
          if (vote.type === "UP") return acc + 1;
          if (vote.type === "DOWN") return acc - 1;
          return acc;
        }, 0);

        const currentVote = post.votes.find(
          (vote) => vote.userId === session?.user.id,
        );

        if (index === posts.length - 1) {
          // Add a ref to the last post in the list
          return (
            <li key={post.id} ref={ref}>
              <SinglePost
                post={post}
                commentAmt={post.comments.length}
                subredditName={post.subreddit.name}
                votesAmt={votesAmt}
                currentVote={currentVote}
              />
            </li>
          );
        } else {
          return (
            <SinglePost
              key={post.id}
              post={post}
              commentAmt={post.comments.length}
              subredditName={post.subreddit.name}
              votesAmt={votesAmt}
              currentVote={currentVote}
            />
          );
        }
      })}

      {isFetchingNextPage && (
        <li className="flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </li>
      )}
    </ul>
  );
};
