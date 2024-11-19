import type { FC } from 'react'
import type { SubmitHandler } from 'react-hook-form'
import { useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

import type { RouterInputs } from '~/trpc/react'
import { Button } from '~/app/forum/_components/button'
import {
  Dialog,
  DialogActions,
  DialogCloseButton,
  DialogContent,
  DialogTitle,
} from '~/app/forum/_components/dialog'
import { TextField } from '~/app/forum/_components/text-field'
import { api } from '~/trpc/react'

type EditFormData = {
  name: string
  title: string | null
}

interface IProps {
  user: {
    name: string
    title: string | null
  }
  isOpen: boolean
  onClose: () => void
}

function getProfileQueryPathAndInput(
  id: string,
): RouterInputs['user']['getForumProfile'] {
  return { id }
}

const EditProfileDialog: FC<IProps> = ({ user, isOpen, onClose }) => {
  const { register, handleSubmit, reset } = useForm<EditFormData>({
    defaultValues: {
      name: user.name,
      title: user.title,
    },
  })

  const params = useParams()
  const utils = api.useUtils()
  const editUserMutation = api.user.editForumProfile.useMutation({
    onSuccess: () => {
      window.location.reload()
      return utils.user.getForumProfile.invalidate(
        getProfileQueryPathAndInput(String(params?.userId)),
      )
    },
    onError: (error) => {
      toast.error(`Something went wrong: ${error.message}`)
    },
  })

  function handleClose() {
    onClose()
    reset()
  }

  const onSubmit: SubmitHandler<EditFormData> = (data) => {
    editUserMutation.mutate(
      {
        name: data.name,
        title: data.title,
      },
      {
        onSuccess: () => onClose(),
      },
    )
  }

  return (
    <Dialog isOpen={isOpen} onClose={handleClose}>
      <form onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
        <DialogContent>
          <DialogTitle>Edit profile</DialogTitle>
          <div className="mt-6 space-y-6">
            <TextField
              {...register('name', { required: true })}
              label="Name"
              required
            />

            <TextField {...register('title')} label="Title" />
          </div>
          <DialogCloseButton onClick={handleClose} />
        </DialogContent>
        <DialogActions>
          <Button
            type="submit"
            isLoading={editUserMutation.isPending}
            loadingChildren="Saving"
          >
            Save
          </Button>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
export default EditProfileDialog
