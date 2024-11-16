import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

import { PostForm } from '~/app/forum/_components/post-form'
import { api } from '~/trpc/react'

export default function NewPostPage() {
  const router = useRouter()
  const addPostMutation = api.post.add.useMutation({
    onError: (error) => {
      toast.error(`Something went wrong: ${error.message}`)
    },
  })

  return (
    <>
      <>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          New form post
        </h1>

        <div className="mt-6">
          <PostForm
            isSubmitting={addPostMutation.isPending}
            defaultValues={{
              title: '',
              content: '',
            }}
            backTo="/"
            onSubmit={(values) => {
              addPostMutation.mutate(
                { title: values.title, content: values.content },
                {
                  onSuccess: (data) =>
                    void router.push(`/forum/post/${data.id}`),
                },
              )
            }}
          />
        </div>
      </>
    </>
  )
}
