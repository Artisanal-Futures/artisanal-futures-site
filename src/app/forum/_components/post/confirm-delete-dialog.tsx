import type { FC } from 'react'
import { useRef } from 'react'
import { useRouter } from 'next/navigation'

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

interface IProps {
  postId: number
  isOpen: boolean
  onClose: () => void
}
const ConfirmDeleteDialog: FC<IProps> = ({ postId, isOpen, onClose }) => {
  const cancelRef = useRef<HTMLButtonElement>(null)
  const router = useRouter()
  const deletePostMutation = api.post.delete.useMutation({
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
        <DialogTitle>Delete post</DialogTitle>
        <DialogDescription className="mt-6">
          Are you sure you want to delete this post?
        </DialogDescription>
        <DialogCloseButton onClick={onClose} />
      </DialogContent>
      <DialogActions>
        <Button
          variant="secondary"
          className="!text-forum-red"
          isLoading={deletePostMutation.isPending}
          loadingChildren="Deleting post"
          onClick={() => {
            deletePostMutation.mutate(postId, {
              onSuccess: () => void router.push('/forum'),
            })
          }}
        >
          Delete post
        </Button>
        <Button variant="secondary" onClick={onClose} ref={cancelRef}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ConfirmDeleteDialog
