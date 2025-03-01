/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
'use client'

import type EditorJS from '@editorjs/editorjs'
import type { z } from 'zod'
import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { toastService } from '@dreamwalker-studios/toasts'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, ChevronsUpDown } from 'lucide-react'
import { useForm } from 'react-hook-form'
import TextareaAutosize from 'react-textarea-autosize'

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '~/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'
import { env } from '~/env'
import { useFileUpload } from '~/lib/file-upload/hooks/use-file-upload'
import { cn } from '~/lib/utils'
import { PostValidator } from '~/lib/validators/post'
import { api } from '~/trpc/react'

import '~/styles/editor.css'

type FormData = z.infer<typeof PostValidator>

type Props = {
  subreddits: {
    id: string
    name: string
  }[]
}

export const EditorGeneric: React.FC<Props> = ({ subreddits }) => {
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

  const [selectedSubreddit, setSelectedSubreddit] = useState<string>('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(PostValidator),
    defaultValues: {
      subredditId: '',
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
        const newPathname = pathname.split('/').slice(0, -1).join('/')
        router.push(newPathname)

        toastService.success('Your post has been published.')

        void apiUtils.forumSubreddit.invalidate()
        void apiUtils.forum.invalidate()

        router.refresh()
      },
    })

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
    if (!selectedSubreddit) {
      toastService.error({
        message: 'Please select a community',
      })
      return
    }

    const blocks = await ref.current?.save()

    createSubredditPost.mutate({
      title: data.title,
      content: blocks,
      subredditId: selectedSubreddit,
    })
  }

  if (!isMounted) {
    return null
  }

  const { ref: titleRef, ...rest } = register('title')

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="w-full pb-5">
        <Popover>
          <PopoverTrigger asChild>
            <button
              role="combobox"
              type="button"
              aria-expanded="false"
              aria-controls="communities-list"
              aria-label="Select a community"
              className={cn(
                'flex h-[38px] w-[300px] items-center justify-between rounded-full border border-input bg-background px-4 py-2 text-sm hover:border-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                !selectedSubreddit && 'text-gray-500',
              )}
            >
              <span className="sr-only">Select a community</span>
              {selectedSubreddit ? (
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FF4500]">
                    <span className="text-xs font-bold text-white">r/</span>
                  </div>
                  <span className="font-medium">
                    {subreddits.find((s) => s.id === selectedSubreddit)?.name}
                  </span>
                </div>
              ) : (
                <span>Choose a community</span>
              )}
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0" align="start">
            <Command className="rounded-lg shadow-md">
              <CommandInput placeholder="Search communities" className="h-9" />
              <CommandEmpty>No communities found.</CommandEmpty>
              <CommandGroup className="max-h-[300px] overflow-auto p-1">
                {subreddits.map((subreddit) => (
                  <CommandItem
                    key={subreddit.id}
                    value={subreddit.name}
                    onSelect={() => {
                      setSelectedSubreddit(
                        selectedSubreddit === subreddit.id ? '' : subreddit.id,
                      )
                    }}
                    className="flex items-center gap-2 px-2 py-1.5 text-sm"
                  >
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FF4500]">
                      <span className="text-xs font-bold text-white">r/</span>
                    </div>
                    <span className="flex-1">{subreddit.name}</span>
                    <Check
                      className={cn(
                        'h-4 w-4',
                        selectedSubreddit === subreddit.id
                          ? 'opacity-100'
                          : 'opacity-0',
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

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
    </div>
  )
}
