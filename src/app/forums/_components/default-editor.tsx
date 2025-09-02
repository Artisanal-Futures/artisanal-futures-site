/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
'use client'

import type EditorJS from '@editorjs/editorjs'
import type { z } from 'zod'
import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import TextareaAutosize from 'react-textarea-autosize'

import { PostValidator } from '~/lib/validators/post'

import '~/styles/editor.css'

import { toastService } from '@dreamwalker-studios/toasts'

import { env } from '~/env'
import { useFileUpload } from '~/lib/file-upload/hooks/use-file-upload'
import { api } from '~/trpc/react'

type FormData = z.infer<typeof PostValidator>

interface EditorProps {
  subredditId: string
}

export const Editor: React.FC<EditorProps> = ({ subredditId }) => {
  const { uploadFile, uploadedFile } = useFileUpload({
    route: 'post',
    api: '/api/upload-post',
    generateThumbnail: false,
  })

  const uploadRef = useRef<string | null>(null)

  useEffect(() => {
    if (uploadedFile?.objectKey) {
      uploadRef.current = uploadedFile.objectKey
    }
  }, [uploadedFile])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(PostValidator),
    defaultValues: {
      subredditId,
      title: '',
      content: null,
    },
  })
  const ref = useRef<EditorJS>()
  const _titleRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()
  const [isMounted, setIsMounted] = useState<boolean>(false)
  const pathname = usePathname()
  const apiUtils = api.useUtils()
  const createSubredditPost =
    api.forumSubreddit.createSubredditPost.useMutation({
      onError: () =>
        toastService.error({
          message: 'Your post was not published. Please try again.',
        }),
      onSuccess: () => {
        // turn pathname /r/mycommunity/submit into /r/mycommunity
        const newPathname = pathname.split('/').slice(0, -1).join('/')
        router.push(newPathname)

        toastService.success('Your post has been published.')
        void apiUtils.forumSubreddit.invalidate()
        void apiUtils.forum.invalidate()

        router.refresh()
      },
    })

  // const { mutate: createPost } = useMutation({
  //   mutationFn: async ({
  //     title,
  //     content,
  //     subredditId,
  //   }: PostCreationRequest) => {
  //     const payload: PostCreationRequest = { title, content, subredditId };
  //     const { data } = await axios.post("/api/subreddit/post/create", payload);
  //     return data;
  //   },
  //   onError: () => {
  //     return toast({
  //       title: "Something went wrong.",
  //       description: "Your post was not published. Please try again.",
  //       variant: "destructive",
  //     });
  //   },
  //   onSuccess: () => {
  //     // turn pathname /r/mycommunity/submit into /r/mycommunity
  //     const newPathname = pathname.split("/").slice(0, -1).join("/");
  //     router.push(newPathname);

  //     router.refresh();

  //     return toast({
  //       description: "Your post has been published.",
  //     });
  //   },
  // });

  const initializeEditor = useCallback(async () => {
    const EditorJS = (await import('@editorjs/editorjs')).default
    const Header = (await import('@editorjs/header')).default
    const Embed = (await import('@editorjs/embed')).default
    const Table = (await import('@editorjs/table')).default
    const List = (await import('@editorjs/list')).default
    const Code = (await import('@editorjs/code')).default
    const LinkTool = (await import('@editorjs/link')).default
    const InlineCode = (await import('@editorjs/inline-code')).default
    const ImageTool = (await import('@editorjs/image')).default

    if (!ref.current) {
      const editor = new EditorJS({
        holder: 'editor',
        onReady() {
          ref.current = editor
        },
        placeholder: 'Type here to write your post...',
        inlineToolbar: true,
        data: { blocks: [] },
        tools: {
          header: Header,
          linkTool: {
            class: LinkTool,
            config: {
              endpoint: '/api/link',
            },
          },
          image: {
            class: ImageTool,
            config: {
              uploader: {
                async uploadByFile(file: File) {
                  const res = await uploadFile(file)

                  return {
                    success: 1,
                    file: {
                      url: `${env.NEXT_PUBLIC_STORAGE_URL}/posts/${res}`,
                    },
                  }

                  // Wait for uploadRef to be updated
                  // return new Promise((resolve) => {
                  //   const checkUpload = setInterval(() => {
                  //     if (uploadRef.current) {
                  //       clearInterval(checkUpload);
                  //       resolve({
                  //         success: 1,
                  //         file: {
                  //           url: `${env.NEXT_PUBLIC_STORAGE_URL}/posts/${uploadRef.current}`,
                  //         },
                  //       });
                  //     }
                  //   }, 100);
                  // });
                },
              },
            },
          },
          list: List,
          code: Code,
          inlineCode: InlineCode,
          table: Table,
          embed: Embed,
        },
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (Object.keys(errors).length) {
      for (const [, value] of Object.entries(errors)) {
        value
        toastService.error({
          message: (value as { message: string }).message,
        })
      }
    }
  }, [errors])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMounted(true)
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      await initializeEditor()

      setTimeout(() => {
        _titleRef?.current?.focus()
      }, 0)
    }

    if (isMounted) {
      void init()

      return () => {
        ref.current?.destroy()
        ref.current = undefined
      }
    }
  }, [isMounted, initializeEditor])

  async function onSubmit(data: FormData) {
    const blocks = await ref.current?.save()

    createSubredditPost.mutate({
      title: data.title,
      content: blocks,
      subredditId,
    })
  }

  if (!isMounted) {
    return null
  }

  const { ref: titleRef, ...rest } = register('title')

  return (
    <div className="w-full rounded-lg border border-border bg-background p-4">
      <form
        id="subreddit-post-form"
        className="w-fit"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="prose prose-stone dark:prose-invert">
          <TextareaAutosize
            ref={(e) => {
              titleRef(e)
              // @ts-expect-error editorjs types
              _titleRef.current = e
            }}
            {...rest}
            placeholder="Title"
            className="w-full resize-none appearance-none overflow-hidden bg-transparent text-5xl font-bold focus:outline-none"
          />
          <div id="editor" className="min-h-[500px]" />
          <p className="text-sm text-gray-500">
            Use{' '}
            <kbd className="rounded-md border bg-muted px-1 text-xs uppercase">
              Tab
            </kbd>{' '}
            to open the command menu.
          </p>
        </div>
      </form>
    </div>
  )
}
