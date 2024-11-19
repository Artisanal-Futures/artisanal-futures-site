'use client'

import type { FC } from 'react'
import { useRef } from 'react'

import type { RouterInputs } from '~/trpc/react'
import { Button } from '~/app/forum/_components/button'
import {
  Dialog,
  DialogActions,
  DialogCloseButton,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '~/app/forum/_components/dialog'
import { toastService } from '~/services/toasts'
import { api } from '~/trpc/react'

function getPostQueryPathAndInput(id: number): RouterInputs['post']['detail'] {
  return { id }
}

interface IProps {
  postId: number
  commentId: number
  isOpen: boolean
  onClose: () => void
}
const ConfirmDeleteCommentDialog: FC<IProps> = ({
  postId,
  commentId,
  isOpen,
  onClose,
}) => {
  const cancelRef = useRef<HTMLButtonElement>(null)
  const utils = api.useUtils()
  const deleteCommentMutation = api.comment.delete.useMutation({
    onSuccess: () => {
      return utils.post.detail.invalidate(getPostQueryPathAndInput(postId))
    },
    onError: (error) => {
      toastService.error({
        error,
        message: 'Something went wrong',
      })
    },
  })

  return (
    <Dialog isOpen={isOpen} onClose={onClose} initialFocus={cancelRef}>
      <DialogContent>
        <DialogTitle>Delete comment</DialogTitle>
        <DialogDescription className="mt-6">
          Are you sure you want to delete this comment?
        </DialogDescription>
        <DialogCloseButton onClick={onClose} />
      </DialogContent>
      <DialogActions>
        <Button
          variant="secondary"
          className="!text-forum-red"
          isLoading={deleteCommentMutation.isPending}
          loadingChildren="Deleting comment"
          onClick={() => {
            deleteCommentMutation.mutate(commentId, {
              onSuccess: () => onClose(),
            })
          }}
        >
          Delete comment
        </Button>
        <Button variant="secondary" onClick={onClose} ref={cancelRef}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ConfirmDeleteCommentDialog
