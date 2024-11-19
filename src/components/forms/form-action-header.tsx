'use client'

import type { ElementRef, FC, HTMLAttributes } from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

import { BreadcrumbItem } from '~/components/ui/breadcrumb'
import { buttonVariants } from '~/components/ui/button'
import { cn } from '~/utils/styles'

type BreadcrumbItem = {
  link?: string
  name: string
  isCurrent?: boolean
}

type Props = {
  title: string
  breadcrumbs?: BreadcrumbItem[]
  unsavedChanges?: boolean
  isArchived?: boolean
  backURL?: string
  previousPath?: string
} & HTMLAttributes<ElementRef<'div'>>

export const FormActionHeader: FC<Props> = ({
  title,
  children,

  unsavedChanges,
  backURL,
  isArchived,
}) => {
  return (
    <header className="sticky top-12 z-[19] lg:top-[4.25rem] lg:mt-4">
      {' '}
      <div
        className={cn(
          'mx-auto flex max-w-5xl items-center justify-between bg-background px-4 py-4 shadow-lg',
        )}
      >
        <div>
          <div>
            <div className="flex items-center gap-2">
              <Link
                href={backURL ?? '/admin'}
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'icon' }),
                  'h-7 w-7',
                )}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
              </Link>

              <h2 className="text-2xl font-bold capitalize tracking-tight">
                {title}
                {unsavedChanges ? ' *' : ''}
              </h2>
            </div>
          </div>
        </div>
        {!isArchived && (
          <div className="flex items-center gap-2">{children}</div>
        )}
        {isArchived && (
          <div className="flex items-center gap-2">
            <p>Item archived</p>
          </div>
        )}
      </div>
      {/* <Separator className="sticky top-32 z-30 shadow" /> */}
    </header>
  )
}
