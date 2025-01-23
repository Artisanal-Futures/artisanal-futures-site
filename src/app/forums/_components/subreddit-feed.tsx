/* eslint-disable @typescript-eslint/no-unsafe-member-access */
"use client";

import type { FC } from "react";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { INFINITE_SCROLL_PAGINATION_RESULTS } from "~/config";
import { Loader2 } from "lucide-react";

import type { ExtendedSubreddit } from "~/types/post";
import { api } from "~/trpc/react";
import { useIntersection } from "~/hooks/use-intersection";

type Props = {
  initialSubreddits: ExtendedSubreddit[];
};

export const SubredditFeed: FC<Props> = ({ initialSubreddits }) => {
  const lastSubredditRef = useRef<HTMLElement>(null);
  const { ref, entry } = useIntersection({
    root: lastSubredditRef.current,
    threshold: 1,
  });

  const { data, fetchNextPage, isFetchingNextPage } =
    api.forumSubreddit.getSubreddits.useInfiniteQuery(
      {
        limit: `${INFINITE_SCROLL_PAGINATION_RESULTS}`,
        page: "1",
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      },
    );

  useEffect(() => {
    if (entry?.isIntersecting) {
      void fetchNextPage(); // Load more subreddits when the last one comes into view
    }
  }, [entry, fetchNextPage]);

  const subreddits =
    data?.pages?.flatMap((page) => page?.subreddits) ?? initialSubreddits;

  return (
    <ul className="col-span-2 flex flex-col space-y-6">
      {subreddits.map((subreddit, index) => {
        const isLastItem = index === subreddits.length - 1;

        return (
          <li
            key={subreddit.id}
            ref={isLastItem ? ref : undefined}
            className="overflow-hidden rounded-lg border border-border hover:border-muted-foreground/80"
          >
            <Link href={`/forums/r/${subreddit.name}`}>
              <div className="bg-background p-6">
                <h3 className="text-lg font-semibold">r/{subreddit.name}</h3>
                <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                  <span>{subreddit._count.subscribers} members</span>
                  <span>{subreddit._count.posts} posts</span>
                </div>
              </div>
            </Link>
          </li>
        );
      })}

      {isFetchingNextPage && (
        <li className="flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
        </li>
      )}
    </ul>
  );
};
