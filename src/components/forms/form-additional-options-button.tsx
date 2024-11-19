'use client'

import { useState } from 'react'
import { Archive, MoreHorizontal, SquareStack, Trash } from 'lucide-react'

import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { cn } from '~/utils/styles'
import { DeleteDialog } from './delete-dialog'

type Props = {
  onDuplicate?: () => void
  onArchive?: () => void
  onDelete?: () => void
}

export function FormAdditionalOptionsButton(props: Props) {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="" type="button">
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            {props?.onDuplicate && (
              <DropdownMenuItem onClick={props.onDuplicate}>
                <SquareStack className="mr-2 h-4 w-4" />
                <span>Save and duplicate</span>
              </DropdownMenuItem>
            )}

            {props?.onArchive && (
              <DropdownMenuItem onClick={props.onArchive}>
                <Archive className="mr-2 h-4 w-4" />
                <span>Archive</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>

          {(props?.onDuplicate ?? props?.onArchive) && (
            <DropdownMenuSeparator />
          )}

          {props?.onDelete && (
            <DropdownMenuItem
              onClick={() => setIsDeleteOpen(true)}
              className={cn(
                'text-destructive focus:bg-destructive/90 focus:text-destructive-foreground',
              )}
            >
              <Trash className="mr-2 h-4 w-4" />
              <span>Delete</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {props?.onDelete && (
        <DeleteDialog
          onDelete={props.onDelete}
          isLoading={false}
          isOpen={isDeleteOpen}
          setIsOpen={setIsDeleteOpen}
        />
      )}
    </>
  )
}
