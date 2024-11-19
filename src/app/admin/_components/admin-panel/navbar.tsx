import Link from 'next/link'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '~/components/ui/breadcrumb'
import { ModeToggle } from '../mode-toggle'
import { SheetMenu } from './sheet-menu'
import { UserNav } from './user-nav'

interface NavbarProps {
  title?: string
  breadcrumbs?: {
    title: string
    href?: string
    isActive?: boolean
  }[]
}

export function Navbar({ title, breadcrumbs }: NavbarProps) {
  return (
    <header className="sticky top-0 z-10 w-full bg-background/95 shadow backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:shadow-secondary">
      <div className="mx-4 flex h-14 items-center sm:mx-8">
        <div className="flex items-center space-x-4 lg:space-x-0">
          <SheetMenu />
          {title && <h1 className="font-bold">{title}</h1>}
          {/* <h1 className="font-bold">{title}</h1> */}

          {breadcrumbs?.length && (
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem key="dashboard">
                  <BreadcrumbLink asChild>
                    <Link href={`/admin/dashboard`}>Dashboard</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                {breadcrumbs.map((crumb, index) => (
                  <>
                    <BreadcrumbItem key={index}>
                      {crumb.href ? (
                        <BreadcrumbLink asChild>
                          <Link href={crumb.href}>{crumb.title}</Link>
                        </BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage>{crumb.title}</BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                    {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                  </>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          )}
        </div>
        <div className="flex flex-1 items-center justify-end">
          <ModeToggle />
          <UserNav />
        </div>
      </div>
    </header>
  )
}
