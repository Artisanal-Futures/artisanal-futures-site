'use client'

import type { Post as PostType, User, Vote } from '@prisma/client'
import type { FC } from 'react'
import { useRef } from 'react'
import Link from 'next/link'
import { MessageSquare } from 'lucide-react'

import { env } from '~/env'
import { formatTimeToNow } from '~/lib/utils'
import { EditorOutput } from './editor-output'
import { HeartPostVoteClient } from './post-vote/heart-post-vote-client'
import { PostVoteClient } from './post-vote/post-vote-client'

type PartialVote = Pick<Vote, 'type'>

type Props = {
  post: PostType & {
    author: User
    votes: Vote[]
  }
  votesAmt: number
  subredditName: string
  currentVote?: PartialVote
  commentAmt: number
}

export const SinglePost: FC<Props> = ({
  post,
  votesAmt: _votesAmt,
  currentVote: _currentVote,
  subredditName,
  commentAmt,
}) => {
  const pRef = useRef<HTMLParagraphElement>(null)

  return (
    <div className="rounded-md bg-background shadow">
      <div className="flex justify-between px-6 py-4">
        {env.NEXT_PUBLIC_HEART_VOTE_DISABLED ? (
          <PostVoteClient
            postId={post.id}
            initialVotesAmt={_votesAmt}
            initialVote={_currentVote?.type}
          />
        ) : (
          <HeartPostVoteClient
            postId={post.id}
            initialVotesAmt={_votesAmt}
            initialVote={_currentVote?.type}
          />
        )}

        <div className="w-0 flex-1">
          <div className="mt-1 max-h-40 text-xs text-muted-foreground">
            {subredditName ? (
              <>
                <a
                  className="text-sm text-foreground underline underline-offset-2"
                  href={`/forums/r/${subredditName}`}
                >
                  r/{subredditName}
                </a>
                <span className="px-1">•</span>
              </>
            ) : null}
            <span>Posted by u/{post.author.username}</span>{' '}
            {formatTimeToNow(new Date(post.createdAt))}
          </div>
          <a href={`/forums/r/${subredditName}/post/${post.id}`}>
            <h1 className="py-2 text-lg font-semibold leading-6 text-foreground">
              {post.title}
            </h1>
          </a>

          <div
            className="relative max-h-40 w-full overflow-clip text-sm"
            ref={pRef}
          >
            <EditorOutput content={post.content} />
            {pRef.current?.clientHeight === 160 ? (
              // blur bottom if content is too long
              <div className="absolute bottom-0 left-0 h-24 w-full bg-gradient-to-t from-white to-transparent"></div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="z-20 bg-muted px-4 py-4 text-sm sm:px-6">
        <Link
          href={`/forums/r/${subredditName}/post/${post.id}`}
          className="flex w-fit items-center gap-2"
        >
          <MessageSquare className="h-4 w-4" /> {commentAmt} comments
        </Link>
      </div>
    </div>
  )
}
