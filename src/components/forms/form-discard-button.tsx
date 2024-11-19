'use client'

import { usePathname, useRouter } from 'next/navigation'

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

type Props = {
  isLoading: boolean
  previousURL?: string
}

export function FormDiscardButton({ isLoading, previousURL }: Props) {
  const path = usePathname()
  const router = useRouter()
  const previousPath = previousURL ?? path.split('/').slice(0, -2).join('/')

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
          Cancel
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="ignore-default">
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            You&apos;ve made some changes. Are you sure you want to discard
            them?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isLoading}
            onClick={() => router.push(previousPath)}
          >
            Discard Changes
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
