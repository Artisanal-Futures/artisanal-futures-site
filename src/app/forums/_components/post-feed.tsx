'use client'

import type { FC } from 'react'
import { useEffect, useRef } from 'react'
// import axios from "axios";
import { Loader2 } from 'lucide-react'
import { useSession } from 'next-auth/react'

import type { ExtendedPost } from '~/types/post'
// import { useInfiniteQuery } from "@tanstack/react-query";

import { INFINITE_SCROLL_PAGINATION_RESULTS } from '~/config'
import { useIntersection } from '~/hooks/use-intersection'
import { api } from '~/trpc/react'
import { SinglePost } from './single-post'

type Props = {
  initialPosts: ExtendedPost[]
  subredditName?: string
}

export const PostFeed: FC<Props> = ({ initialPosts, subredditName }) => {
  const lastPostRef = useRef<HTMLElement>(null)
  const { ref, entry } = useIntersection({
    root: lastPostRef.current,
    threshold: 1,
  })
  const { data: session } = useSession()

  // const { data, fetchNextPage, isFetchingNextPage } = useInfiniteQuery(
  //   ["infinite-query"],
  //   async ({ pageParam = 1 }) => {
  //     const query =
  //       `/api/posts?limit=${INFINITE_SCROLL_PAGINATION_RESULTS}&page=${pageParam}` +
  //       (!!subredditName ? `&subredditName=${subredditName}` : "");

  //     const { data } = await axios.get(query);
  //     return data as ExtendedPost[];
  //   },

  //   {
  //     getNextPageParam: (_, pages) => {
  //       return pages.length + 1;
  //     },
  //     initialData: { pages: [initialPosts], pageParams: [1] },
  //   },
  // );

  const { data, fetchNextPage, isFetchingNextPage } =
    api.forumSubreddit.getPosts.useInfiniteQuery(
      {
        limit: `${INFINITE_SCROLL_PAGINATION_RESULTS}`,
        page: '1',
        subredditName,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      },
    )

  useEffect(() => {
    if (entry?.isIntersecting) {
      void fetchNextPage() // Load more posts when the last post comes into view
    }
  }, [entry, fetchNextPage])

  const posts = data?.pages?.flatMap((page) => page?.posts) ?? initialPosts

  if (posts.length === 0) {
    return (
      <div className="col-span-2 flex flex-col items-center justify-center space-y-4 py-12">
        <p className="text-lg text-muted-foreground">No posts yet.</p>
        <p className="text-sm text-muted-foreground">
          Be the first one to make a post!
        </p>
      </div>
    )
  }

  return (
    <ul className="col-span-2 flex flex-col space-y-6">
      {posts.map((post, index) => {
        const votesAmt = post.votes.reduce((acc, vote) => {
          if (vote.type === 'UP') return acc + 1
          if (vote.type === 'DOWN') return acc - 1
          return acc
        }, 0)

        const currentVote = post.votes.find(
          (vote) => vote.userId === session?.user.id,
        )

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
          )
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
          )
        }
      })}

      {isFetchingNextPage && (
        <li className="flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
        </li>
      )}
    </ul>
  )
}
