'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog'
import { Button, buttonVariants } from '~/components/ui/button'
import { toastService } from '~/services/toasts'
import { api } from '~/trpc/react'
import { cn } from '~/utils/styles'

type Props = {
  isLoading: boolean

  onDelete: () => void
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

export function DeleteDialog({
  isLoading,
  isOpen,
  setIsOpen,
  onDelete,
}: Props) {
  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent className="ignore-default">
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. There may be unintended side effects
            depending on the item being deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isLoading}
            onClick={onDelete}
            className={cn(buttonVariants({ variant: 'destructive' }))}
          >
            {isLoading ? (
              <span>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
              </span>
            ) : (
              'Delete'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function DeleteItemBtn({ id }: { id: number }) {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const apiUtils = api.useUtils()
  const router = useRouter()

  const { mutate: deleteUpcycling, isPending } =
    api.upcycling.delete.useMutation({
      onSuccess: ({ message }) => {
        toastService.success({ message })
        setIsDeleteOpen(false)
      },
      onError: ({ message }) => {
        toastService.error({ message })
      },
      onSettled: () => {
        void apiUtils.upcycling.invalidate()
        void router.refresh()
      },
    })

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        className=" h-8 "
        onClick={() => setIsDeleteOpen(true)}
      >
        Delete
      </Button>{' '}
      <DeleteDialog
        onDelete={() => deleteUpcycling({ id })}
        isLoading={isPending}
        isOpen={isDeleteOpen}
        setIsOpen={setIsDeleteOpen}
      />
    </>
  )
}
