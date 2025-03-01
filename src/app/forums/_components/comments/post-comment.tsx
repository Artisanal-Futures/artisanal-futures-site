'use client'

import type { CommentVote, ForumComment, User } from '@prisma/client'
import type { FC } from 'react'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toastService } from '@dreamwalker-studios/toasts'
import { MessageSquare } from 'lucide-react'
import { useSession } from 'next-auth/react'

import { LoadButton } from '~/components/common/load-button'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { env } from '~/env'
import { useOnClickOutside } from '~/hooks/use-on-click-outside'
import { formatTimeToNow } from '~/lib/utils'
import { api } from '~/trpc/react'
import { CommentEditButton } from '../comment-edit-button'
import { CommentVotes } from '../comment-votes'
import { HeartCommentVotes } from '../heart-comment-votes'
import { UserAvatar } from '../user-avatar'

type ExtendedComment = ForumComment & {
  votes: CommentVote[]
  author: User
}

type Props = {
  comment: ExtendedComment
  votesAmt: number
  currentVote: CommentVote | undefined
  postId: string
  originalPostAuthorId: string
}

export const PostComment: FC<Props> = ({
  comment,
  votesAmt,
  currentVote,
  postId,
  originalPostAuthorId,
}) => {
  const { data: session } = useSession()
  const [isReplying, setIsReplying] = useState<boolean>(false)
  const commentRef = useRef<HTMLDivElement>(null)
  const [input, setInput] = useState<string>(`@${comment.author.username} `)
  const router = useRouter()
  useOnClickOutside(commentRef, () => {
    setIsReplying(false)
  })

  const isOriginalPostAuthor = originalPostAuthorId === comment.authorId

  const postCommentMutation =
    api.forumSubreddit.createSubredditPostComment.useMutation({
      onError: () =>
        toastService.error({
          message: "Comment wasn't created successfully. Please try again.",
        }),
      onSuccess: () => {
        router.refresh()
        setIsReplying(false)
      },
    })
  return (
    <div ref={commentRef} className="flex flex-col">
      <div className="flex items-center justify-between">
        {comment.deletedAt ? (
          <div className="flex items-center">
            <UserAvatar
              user={{
                name: null,
                image: null,
              }}
              className="h-6 w-6"
            />
            <div className="ml-2 flex items-center gap-x-2">
              <p className="text-sm font-medium text-foreground">Deleted</p>

              <p className="max-h-40 truncate text-xs text-muted-foreground">
                {formatTimeToNow(new Date(comment.deletedAt))}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center">
            <UserAvatar
              user={{
                name: comment.author.username ?? null,
                image: comment.author.image ?? null,
              }}
              className="h-6 w-6"
            />
            <div className="ml-2 flex items-center gap-x-2">
              <p className="text-sm font-medium text-foreground">
                u/{comment.author.username}
              </p>
              {isOriginalPostAuthor && <Badge variant="outline">OP</Badge>}

              <p className="max-h-40 truncate text-xs text-muted-foreground">
                {formatTimeToNow(new Date(comment.createdAt))}
              </p>
            </div>
          </div>
        )}

        {comment.authorId === session?.user.id && !comment.deletedAt && (
          <CommentEditButton commentId={comment.id} text={comment.text} />
        )}
      </div>

      {comment.deletedAt ? (
        <p className="mt-2 text-sm text-muted-foreground">
          This comment was deleted by user.
        </p>
      ) : (
        <p className="mt-2 text-sm text-foreground">{comment.text}</p>
      )}
      <div className="flex items-center gap-2">
        {env.NEXT_PUBLIC_HEART_VOTE_DISABLED ? (
          <CommentVotes
            commentId={comment.id}
            votesAmt={votesAmt}
            currentVote={currentVote}
          />
        ) : (
          <HeartCommentVotes
            commentId={comment.id}
            votesAmt={votesAmt}
            currentVote={currentVote}
          />
        )}

        <Button
          onClick={() => {
            if (!session) return router.push('/sign-in')
            setIsReplying(true)
          }}
          variant="ghost"
          size="xs"
        >
          <MessageSquare className="mr-1.5 h-4 w-4" />
          Reply
        </Button>
      </div>

      {isReplying ? (
        <div className="grid w-full gap-1.5">
          <Label htmlFor="comment">Your comment</Label>
          <div className="mt-2">
            <Textarea
              onFocus={(e) =>
                e.currentTarget.setSelectionRange(
                  e.currentTarget.value.length,
                  e.currentTarget.value.length,
                )
              }
              autoFocus
              id="comment"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={1}
              placeholder="What are your thoughts?"
            />

            <div className="mt-2 flex justify-end gap-2">
              <Button
                tabIndex={-1}
                variant="subtle"
                onClick={() => setIsReplying(false)}
              >
                Cancel
              </Button>
              <LoadButton
                isLoading={postCommentMutation.isPending}
                onClick={() => {
                  if (!input) return
                  postCommentMutation.mutate({
                    postId,
                    text: input,
                    replyToId: comment.replyToId ?? comment.id, // default to top-level comment
                  })
                }}
              >
                Post
              </LoadButton>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
