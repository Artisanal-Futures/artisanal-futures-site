import type { FC } from 'react'
import { useRef, useState } from 'react'

import { Avatar } from '~/app/forum/_components/avatar'
import { Button } from '~/app/forum/_components/button'
import {
  Dialog,
  DialogActions,
  DialogCloseButton,
  DialogContent,
  DialogTitle,
} from '~/app/forum/_components/dialog'
import { toastService } from '~/services/toasts'
import { api } from '~/trpc/react'

interface IProps {
  user: {
    name: string
    image: string | null
  }
  isOpen: boolean
  onClose: () => void
}

const UpdateAvatarDialog: FC<IProps> = ({ user, isOpen, onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadedImage, setUploadedImage] = useState(user.image)
  const updateUserAvatarMutation = api.user.updateForumAvatar.useMutation({
    onSuccess: () => {
      window.location.reload()
    },
    onError: (error) => {
      toastService.error({
        error,
        message: 'Something went wrong',
      })
    },
  })
  const uploadImageMutation = api.user.uploadForumImage.useMutation({
    onError: (error) => {
      toastService.error({
        error,
        message: 'Error uploading image',
      })
    },
  })

  function handleClose() {
    onClose()
    setUploadedImage(user.image)
  }

  const saveChanges = () => {
    if (user.image === uploadedImage) {
      handleClose()
    } else {
      const files = fileInputRef.current?.files

      if (files && files.length > 0) {
        uploadImageMutation.mutate(files[0], {
          onSuccess: (uploadedImage) => {
            updateUserAvatarMutation.mutate({
              image: uploadedImage.url,
            })
          },
        })
      } else {
        updateUserAvatarMutation.mutate({
          image: null,
        })
      }
    }
  }

  return (
    <Dialog isOpen={isOpen} onClose={handleClose}>
      <DialogContent>
        <DialogTitle>Update avatar</DialogTitle>
        <DialogCloseButton onClick={handleClose} />
        <div className="mt-8 flex justify-center">
          <Avatar name={user.name} src={uploadedImage} size="lg" />
        </div>
        <div className="mt-6 grid grid-flow-col gap-6">
          <div className="text-center">
            <Button
              variant="secondary"
              onClick={() => {
                fileInputRef.current?.click()
              }}
            >
              Choose file…
            </Button>
            <input
              ref={fileInputRef}
              name="user-image"
              type="file"
              accept=".jpg, .jpeg, .png, .gif"
              className="hidden"
              aria-label="Upload avatar"
              onChange={(event) => {
                const files = event.target.files

                if (files && files.length > 0) {
                  const file = files[0]!
                  if (file.size > 5242880) {
                    toastService.error({
                      message: 'Image is bigger than 5MB',
                    })
                    return
                  }
                  setUploadedImage(URL.createObjectURL(file))
                }
              }}
            />
            <p className="mt-2 text-xs text-forum-secondary">
              JPEG, PNG, GIF / 5MB max
            </p>
          </div>
          {uploadedImage && (
            <div className="text-center">
              <Button
                variant="secondary"
                className="!text-forum-red"
                onClick={() => {
                  fileInputRef.current!.value = ''
                  URL.revokeObjectURL(uploadedImage)
                  setUploadedImage(null)
                }}
              >
                Remove photo
              </Button>
              <p className="mt-2 text-xs text-forum-secondary">
                And use default avatar
              </p>
            </div>
          )}
        </div>
      </DialogContent>
      <DialogActions>
        <Button
          isLoading={
            updateUserAvatarMutation.isPending || uploadImageMutation.isPending
          }
          loadingChildren="Saving changes"
          onClick={saveChanges}
        >
          Save changes
        </Button>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default UpdateAvatarDialog
