import type { FC } from 'react'
import { useRef } from 'react'
import toast from 'react-hot-toast'

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
  isOpen: boolean
  onClose: () => void
}

const ConfirmHideDialog: FC<IProps> = ({ postId, isOpen, onClose }) => {
  const cancelRef = useRef<HTMLButtonElement>(null)
  const utils = api.useUtils()
  const hidePostMutation = api.post.hide.useMutation({
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
        <DialogTitle>Hide post</DialogTitle>
        <DialogDescription className="mt-6">
          Are you sure you want to hide this post?
        </DialogDescription>
        <DialogCloseButton onClick={onClose} />
      </DialogContent>
      <DialogActions>
        <Button
          variant="secondary"
          isLoading={hidePostMutation.isPending}
          loadingChildren="Hiding post"
          onClick={() => {
            hidePostMutation.mutate(postId, {
              onSuccess: () => {
                toast.success('Post hidden')
                onClose()
              },
            })
          }}
        >
          Hide post
        </Button>
        <Button variant="secondary" onClick={onClose} ref={cancelRef}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  )
}
export default ConfirmHideDialog
