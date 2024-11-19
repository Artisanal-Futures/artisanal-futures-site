import { Archive, Loader2 } from 'lucide-react'

import type { ButtonProps } from '~/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '~/components/ui/alert-dialog'
import { Button } from '~/components/ui/button'
import { cn } from '~/utils/styles'

type Props = {
  isLoading: boolean
  onArchive: () => void
  size?: ButtonProps['size']
}

export function ArchiveAlertDialog({ isLoading, onArchive, size }: Props) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size={size ?? 'sm'}>
          <Archive className={cn('mr-2 h-4 w-4', size === 'icon' && 'mr-0')} />{' '}
          {size === 'icon' ? '' : 'Archive'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="ignore-default">
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            Archiving this item will mark it as &apos;read-only&apos; and will
            be hidden from admin. (You can still access it via the item&apos;s
            id)
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={isLoading} onClick={onArchive}>
            {isLoading ? (
              <span>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Archiving...
              </span>
            ) : (
              'Archive'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
