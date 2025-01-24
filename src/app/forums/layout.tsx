import Image from 'next/image'
import Link from 'next/link'
import { Plus } from 'lucide-react'

import { ModeToggle } from '~/components/admin/mode-toggle'
import { buttonVariants } from '~/components/ui/button'
import { Separator } from '~/components/ui/separator'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '~/components/ui/sidebar'
import { cn } from '~/lib/utils'
import { AppSidebar } from './_components/app-sidebar'
import { SearchBar } from './_components/search-bar'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-16">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Image
              src="/logo.png"
              alt="Artisanal Futures Logo"
              width={158}
              height={8}
              className=" object-contain"
            />
          </div>

          <div className="flex w-full max-w-lg items-center gap-4 px-4">
            {' '}
            <div className="flex aspect-square items-center justify-center">
              <ModeToggle />
            </div>
            <SearchBar />
            <Link
              href="/forums/create"
              className={cn(
                buttonVariants({ variant: 'outline', size: 'sm' }),
                'flex items-center gap-1 text-xs',
              )}
            >
              <Plus />
              Create Post
            </Link>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/25 p-4 md:min-h-min">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
