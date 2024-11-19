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
import { buttonVariants } from '~/components/ui/button'
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
