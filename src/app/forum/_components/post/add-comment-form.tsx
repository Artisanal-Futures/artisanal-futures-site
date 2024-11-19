'use client'

import type { FC } from 'react'
import type { SubmitHandler } from 'react-hook-form'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

import type { RouterInputs } from '~/trpc/react'
import { Button } from '~/app/forum/_components/button'
import { MarkdownEditor } from '~/app/forum/_components/markdown-editor'
import { toastService } from '~/services/toasts'
import { api } from '~/trpc/react'

function getPostQueryPathAndInput(id: number): RouterInputs['post']['detail'] {
  return { id }
}
type CommentFormData = {
  content: string
}
const AddCommentForm: FC<{ postId: number }> = ({ postId }) => {
  const [markdownEditorKey, setMarkdownEditorKey] = useState(0)
  const utils = api.useUtils()
  const addCommentMutation = api.comment.add.useMutation({
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
  const { control, handleSubmit, reset } = useForm<CommentFormData>()

  const onSubmit: SubmitHandler<CommentFormData> = (data) => {
    addCommentMutation.mutate(
      {
        postId,
        content: data.content,
      },
      {
        onSuccess: () => {
          reset({ content: '' })
          setMarkdownEditorKey((markdownEditorKey) => markdownEditorKey + 1)
        },
      },
    )
  }

  return (
    <form className="flex-1" onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
      <Controller
        name="content"
        control={control}
        rules={{ required: true }}
        render={({ field }) => (
          <MarkdownEditor
            key={markdownEditorKey}
            value={field.value}
            onChange={field.onChange}
            onTriggerSubmit={() => void handleSubmit(onSubmit)()}
            required
            placeholder="Comment"
            minRows={4}
          />
        )}
      />
      <div className="mt-4">
        <Button
          type="submit"
          isLoading={addCommentMutation.isPending}
          loadingChildren="Adding comment"
        >
          Add comment
        </Button>
      </div>
    </form>
  )
}

export default AddCommentForm
