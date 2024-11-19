import { cn } from '~/utils/styles'
import { Navbar } from './navbar'

interface ContentLayoutProps {
  title: string
  children: React.ReactNode
  className?: string
}

export function ContentLayout({
  title,
  children,
  className,
}: ContentLayoutProps) {
  return (
    <div>
      <Navbar title={title} />
      <div className={cn('container px-4 pb-8 pt-8 sm:px-8', className)}>
        {children}
      </div>
    </div>
  )
}
