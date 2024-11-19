import type { ElementRef, FC, HTMLAttributes } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  breadcrumbs: BreadcrumbItem[]
  unsavedChanges?: boolean
  isArchived?: boolean
  backURL?: string
} & HTMLAttributes<ElementRef<'div'>>

export const FormHeader: FC<Props> = ({
  title,
  children,
  breadcrumbs,
  unsavedChanges,
  backURL,
  isArchived,
}) => {
  const path = usePathname()

  const previousPath = path.split('/').slice(0, -2).join('/')

  return (
    <header className="bg-background shadow">
      {' '}
      <div
        className={cn(
          'mx-auto flex max-w-5xl items-center justify-between px-4 py-4',
        )}
      >
        <div>
          {/* <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/admin/dashboard">
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              {breadcrumbs?.map((item, idx) => (
                <Fragment key={idx}>
                  <BreadcrumbItem>
                    {item.isCurrent ? (
                      <BreadcrumbPage>{item.name}</BreadcrumbPage>
                    ) : (
                      <>
                        <BreadcrumbLink href={item.link}>
                          {item.name}
                        </BreadcrumbLink>
                      </>
                    )}
                  </BreadcrumbItem>
                  {!item.isCurrent && <BreadcrumbSeparator />}
                </Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb> */}

          <div>
            <div className="flex items-center gap-2">
              <Link
                href={backURL ?? previousPath}
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
