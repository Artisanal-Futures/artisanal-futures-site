'use client'

import { Fragment, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

import type { RouterInputs } from '~/utils/api'
import { AuthorWithDate } from '~/app/forum/_components/author-with-date'
import { Avatar } from '~/app/forum/_components/avatar'
import { Banner } from '~/app/forum/_components/banner'
import { ButtonLink } from '~/app/forum/_components/button-link'
import { HtmlView } from '~/app/forum/_components/html-view'
import { IconButton } from '~/app/forum/_components/icon-button'
import {
  DotsIcon,
  EditIcon,
  EyeClosedIcon,
  EyeIcon,
  MessageIcon,
  TrashIcon,
} from '~/app/forum/_components/icons'
import { LikeButton } from '~/app/forum/_components/like-button'
import {
  Menu,
  MenuButton,
  MenuItemButton,
  MenuItems,
  MenuItemsContent,
} from '~/app/forum/_components/menu'
import AddCommentForm from '~/app/forum/_components/post/add-comment-form'
import Comment from '~/app/forum/_components/post/comment'
import ConfirmDeleteDialog from '~/app/forum/_components/post/confirm-delete-dialog'
import ConfirmHideDialog from '~/app/forum/_components/post/confirm-hide-dialog'
import ConfirmUnhideDialog from '~/app/forum/_components/post/confirm-unhide-dialog'
import { api } from '~/trpc/react'

function getPostQueryPathAndInput(id: number): RouterInputs['post']['detail'] {
  return { id }
}

{
  /* <Head>
<title>{postQuery.data.title} - AF Forums</title>
</Head> */
}

export default function PostPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()

  const utils = api.useUtils()
  const postQueryPathAndInput = getPostQueryPathAndInput(Number(params.id))
  const postQuery = api.post.detail.useQuery(postQueryPathAndInput)
  const likeMutation = api.post.like.useMutation({
    onMutate: async () => {
      await utils.post.detail.invalidate(postQueryPathAndInput)

      const previousPost = utils.post.detail.getData(postQueryPathAndInput)

      if (previousPost && session) {
        utils.post.detail.setData(postQueryPathAndInput, {
          ...previousPost,
          likedBy: [
            ...previousPost.likedBy,
            {
              user: {
                id: session.user.id ?? null,
                name: session.user.name ?? null,
              },
            },
          ],
        })
      }

      return { previousPost }
    },
    onError: (err, id, context) => {
      if (context?.previousPost) {
        utils.post.detail.setData(postQueryPathAndInput, context.previousPost)
      }
    },
  })
  const unlikeMutation = api.post.unlike.useMutation({
    onMutate: async () => {
      await utils.post.detail.invalidate(postQueryPathAndInput)

      const previousPost = utils.post.detail.getData(postQueryPathAndInput)

      if (previousPost) {
        utils.post.detail.setData(postQueryPathAndInput, {
          ...previousPost,
          likedBy: previousPost.likedBy.filter(
            (item) => item.user.id !== session!.user.id,
          ),
        })
      }

      return { previousPost }
    },
    onError: (err, id, context) => {
      if (context?.previousPost) {
        utils.post.detail.setData(postQueryPathAndInput, context.previousPost)
      }
    },
  })
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] =
    useState(false)
  const [isConfirmHideDialogOpen, setIsConfirmHideDialogOpen] = useState(false)
  const [isConfirmUnhideDialogOpen, setIsConfirmUnhideDialogOpen] =
    useState(false)

  function handleHide() {
    setIsConfirmHideDialogOpen(true)
  }

  function handleUnhide() {
    setIsConfirmUnhideDialogOpen(true)
  }

  function handleEdit() {
    void router.push(`/forum/post/${postQuery.data?.id}/edit`)
  }

  function handleDelete() {
    setIsConfirmDeleteDialogOpen(true)
  }

  if (postQuery.data) {
    const isUserAdmin = session!.user.role === 'ADMIN'
    const postBelongsToUser = postQuery.data.author.id === session!.user.id

    return (
      <>
        <>
          <article className="divide-y divide-forum-primary">
            <div className="pb-12">
              {postQuery.data.hidden && (
                <Banner className="mb-6">
                  This post has been hidden and is only visible to
                  administrators.
                </Banner>
              )}

              <div className="my-6 flex items-center justify-between gap-4 ">
                <h1 className="text-3xl font-semibold tracking-tighter md:text-4xl">
                  {postQuery.data.title}
                </h1>
                {(postBelongsToUser || isUserAdmin) && (
                  <>
                    <div className="flex md:hidden">
                      <Menu>
                        <MenuButton
                          as={IconButton}
                          variant="secondary"
                          title="More"
                        >
                          <DotsIcon className="h-4 w-4" />
                        </MenuButton>

                        <MenuItems className="w-28">
                          <MenuItemsContent>
                            {isUserAdmin &&
                              (postQuery.data.hidden ? (
                                <MenuItemButton onClick={handleUnhide}>
                                  Unhide
                                </MenuItemButton>
                              ) : (
                                <MenuItemButton onClick={handleHide}>
                                  Hide
                                </MenuItemButton>
                              ))}
                            {postBelongsToUser && (
                              <>
                                <MenuItemButton onClick={handleEdit}>
                                  Edit
                                </MenuItemButton>
                                <MenuItemButton
                                  className="!text-forum-red"
                                  onClick={handleDelete}
                                >
                                  Delete
                                </MenuItemButton>
                              </>
                            )}
                          </MenuItemsContent>
                        </MenuItems>
                      </Menu>
                    </div>
                    <div className="hidden md:flex md:gap-4">
                      {isUserAdmin &&
                        (postQuery.data.hidden ? (
                          <IconButton
                            variant="secondary"
                            title="Unhide"
                            onClick={handleUnhide}
                          >
                            <EyeIcon className="h-4 w-4" />
                          </IconButton>
                        ) : (
                          <IconButton
                            variant="secondary"
                            title="Hide"
                            onClick={handleHide}
                          >
                            <EyeClosedIcon className="h-4 w-4" />
                          </IconButton>
                        ))}
                      {postBelongsToUser && (
                        <>
                          <IconButton
                            variant="secondary"
                            title="Edit"
                            onClick={handleEdit}
                          >
                            <EditIcon className="h-4 w-4" />
                          </IconButton>
                          <IconButton
                            variant="secondary"
                            title="Delete"
                            onClick={handleDelete}
                          >
                            <TrashIcon className="h-4 w-4 text-forum-red" />
                          </IconButton>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
              <div className="mt-6">
                <AuthorWithDate
                  author={postQuery.data.author}
                  date={postQuery.data.createdAt}
                />
              </div>
              <HtmlView html={postQuery.data.contentHtml} className="mt-8" />
              <div className="clear-both mt-6 flex items-center gap-4">
                <LikeButton
                  likedBy={postQuery.data.likedBy}
                  onLike={() => {
                    likeMutation.mutate(postQuery.data.id)
                  }}
                  onUnlike={() => {
                    unlikeMutation.mutate(postQuery.data.id)
                  }}
                />
                <ButtonLink
                  href={`/forum/post/${postQuery.data.id}#comments`}
                  variant="secondary"
                >
                  <MessageIcon className="h-4 w-4 text-forum-secondary" />
                  <span className="ml-1.5">
                    {postQuery.data.comments.length}
                  </span>
                </ButtonLink>
              </div>
            </div>

            <div id="comments" className="space-y-12 pt-12">
              {postQuery.data.comments.length > 0 && (
                <ul className="space-y-12">
                  {postQuery.data.comments.map((comment) => (
                    <li key={comment.id}>
                      <Comment postId={postQuery.data.id} comment={comment} />
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex items-start gap-2 sm:gap-4">
                <span className="hidden sm:inline-block">
                  <Avatar
                    name={session?.user?.name ?? 'Anonymous'}
                    src={session?.user?.image ?? ''}
                  />
                </span>
                <span className="inline-block sm:hidden">
                  <Avatar
                    name={session?.user?.name ?? 'Anonymous'}
                    src={session?.user?.image ?? ''}
                    size="sm"
                  />
                </span>
                <AddCommentForm postId={postQuery.data.id} />
              </div>
            </div>
          </article>

          <ConfirmDeleteDialog
            postId={postQuery.data.id}
            isOpen={isConfirmDeleteDialogOpen}
            onClose={() => {
              setIsConfirmDeleteDialogOpen(false)
            }}
          />

          <ConfirmHideDialog
            postId={postQuery.data.id}
            isOpen={isConfirmHideDialogOpen}
            onClose={() => {
              setIsConfirmHideDialogOpen(false)
            }}
          />

          <ConfirmUnhideDialog
            postId={postQuery.data.id}
            isOpen={isConfirmUnhideDialogOpen}
            onClose={() => {
              setIsConfirmUnhideDialogOpen(false)
            }}
          />
        </>
      </>
    )
  }

  if (postQuery.isError) {
    return (
      <>
        <div>Error: {postQuery.error.message}</div>
      </>
    )
  }

  return (
    <>
      <div className="animate-pulse">
        <div className="h-9 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="mt-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700" />
          <div className="flex-1">
            <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="mt-2 h-3 w-32 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
        <div className="mt-7 space-y-3">
          {[...Array(3)].map((_, idx) => (
            <Fragment key={idx}>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 h-5 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="col-span-1 h-5 rounded bg-gray-200 dark:bg-gray-700" />
              </div>
              <div className="h-5 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1 h-5 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="col-span-2 h-5 rounded bg-gray-200 dark:bg-gray-700" />
              </div>
              <div className="h-5 w-3/5 rounded bg-gray-200 dark:bg-gray-700" />
            </Fragment>
          ))}
        </div>
        <div className="mt-6 flex gap-4">
          <div className="h-button w-16 rounded-full border border-forum-secondary" />
          <div className="h-button w-16 rounded-full border border-forum-secondary" />
        </div>
      </div>
    </>
  )
}
