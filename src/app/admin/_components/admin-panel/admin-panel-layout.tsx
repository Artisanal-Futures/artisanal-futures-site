'use client'

import { useSidebarToggle } from '~/app/admin/_hooks/use-sidebar-toggle'
import { useStore } from '~/app/admin/_hooks/use-store'
import { cn } from '~/utils/styles'
import { Footer } from './footer'
import { Sidebar } from './sidebar'

type Props = {
  children: React.ReactNode
}
export default function AdminPanelLayout({ children }: Props) {
  const sidebar = useStore(useSidebarToggle, (state) => state)

  if (!sidebar) return null

  return (
    <>
      <Sidebar />
      <main
        className={cn(
          'min-h-[calc(100vh_-_56px)] bg-zinc-50 transition-[margin-left] duration-300 ease-in-out dark:bg-zinc-900',
          sidebar?.isOpen === false ? 'lg:ml-[90px]' : 'lg:ml-72',
        )}
      >
        {children}
      </main>
      <footer
        className={cn(
          'transition-[margin-left] duration-300 ease-in-out',
          sidebar?.isOpen === false ? 'lg:ml-[90px]' : 'lg:ml-72',
        )}
      >
        <Footer />
      </footer>
    </>
  )
}
