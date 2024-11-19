'use client'

import type { User } from '@prisma/client'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'

import type { PostSummaryProps } from '~/app/forum/_components/post-summary'
import type { RouterInputs } from '~/trpc/react'
import {
  getQueryPaginationInput,
  Pagination,
} from '~/app/forum/_components/pagination'
import { PostSummarySkeleton } from '~/app/forum/_components/post-summary-skeleton'
import { Button } from '~/components/ui/button'
import { api } from '~/trpc/react'

const PostSummary = dynamic<PostSummaryProps>(
  () =>
    import('~/app/forum/_components/post-summary').then(
      (mod) => mod.PostSummary,
    ),
  { ssr: false },
)

const POSTS_PER_PAGE = 20

export default function Home() {
  const { data: session } = useSession()
  const user = session?.user
  const params = useParams()
  const currentPageNumber = params.page ? Number(params.page) : 1
  const utils = api.useUtils()
  const feedQueryPathAndInput: RouterInputs['post']['feed'] =
    getQueryPaginationInput(POSTS_PER_PAGE, currentPageNumber)

  const feedQuery = api.post.feed.useQuery(feedQueryPathAndInput)
  const likeMutation = api.post.like.useMutation({
    onMutate: async (likedPostId) => {
      await utils.post.feed.invalidate(feedQueryPathAndInput)

      const previousQuery = utils.post.feed.getData(feedQueryPathAndInput)
      try {
        if (previousQuery && user) {
          utils.post.feed.setData(feedQueryPathAndInput, {
            ...previousQuery,

            posts: previousQuery.posts.map((post) =>
              post.id === likedPostId
                ? {
                    ...post,
                    likedBy: [
                      ...post.likedBy,
                      {
                        user: {
                          id: user.id,
                          name: user.name ?? null,
                        },
                      },
                    ],
                  }
                : post,
            ),
          })
        }
      } catch (err) {}

      return { previousQuery }
    },
    onError: (err, id, context) => {
      if (context?.previousQuery) {
        utils.post.feed.setData(feedQueryPathAndInput, context?.previousQuery)
      }
    },
  })
  const unlikeMutation = api.post.unlike.useMutation({
    onMutate: async (unlikedPostId) => {
      if (!user) return
      await utils.post.feed.invalidate(feedQueryPathAndInput)

      const previousQuery = utils.post.feed.getData(feedQueryPathAndInput)

      if (previousQuery) {
        utils.post.feed.setData(feedQueryPathAndInput, {
          ...previousQuery,
          posts: previousQuery.posts.map((post) =>
            post.id === unlikedPostId
              ? {
                  ...post,
                  likedBy: post.likedBy.filter(
                    (item) => item.user.id !== user.id,
                  ),
                }
              : post,
          ),
        })
      }

      return { previousQuery }
    },
    onError: (err, id, context) => {
      if (context?.previousQuery) {
        utils.post.feed.setData(feedQueryPathAndInput, context?.previousQuery)
      }
    },
  })

  if (feedQuery.data) {
    return (
      <>
        <>
          <div className="flex justify-between p-4">
            <Link href="/forum/new">
              <Button className="rounded-full">
                <span className="sm:hidden">Post</span>
                <span className="hidden shrink-0 sm:block">
                  Create a new form post
                </span>
              </Button>
            </Link>

            {/* <SortButton /> */}
          </div>
          {feedQuery.data.postCount === 0 ? (
            <div className="rounded border px-10 py-20 text-center text-forum-secondary ">
              There are no published posts to show yet.
            </div>
          ) : (
            <>
              <div className="flow-root">
                <ul className=" space-y-2 divide-y divide-forum-primary">
                  {feedQuery.data.posts.map((post) => (
                    <li
                      key={post.id}
                      className="px-4 py-10 hover:rounded-2xl hover:bg-slate-50"
                    >
                      <PostSummary
                        post={post}
                        onLike={() => {
                          likeMutation.mutate(post.id)
                        }}
                        onUnlike={() => {
                          unlikeMutation.mutate(post.id)
                        }}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          <Pagination
            itemCount={feedQuery.data.postCount}
            itemsPerPage={POSTS_PER_PAGE}
            currentPageNumber={currentPageNumber}
          />
        </>
      </>
    )
  }

  if (feedQuery.isError) {
    return (
      <>
        <div>Error: {feedQuery.error.message}</div>
      </>
    )
  }

  return (
    <>
      <div className="flow-root">
        <ul className="-my-12 divide-y divide-forum-primary">
          {[...Array(3)].map((_, idx) => (
            <li key={idx} className="py-10">
              <PostSummarySkeleton />
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}
