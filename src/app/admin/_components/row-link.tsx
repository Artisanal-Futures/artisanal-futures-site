'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { buttonVariants } from '~/components/ui/button'
import { cn } from '~/utils/styles'

type Props = {
  id: string
  name: string
  href?: string
  isActive?: boolean
}

export const RowLink = ({ id, name, href, isActive }: Props) => {
  const pathname = usePathname()

  return (
    <div className="flex flex-col items-start">
      <Link
        href={href ?? `${pathname}/${id}/edit`}
        className={cn(
          buttonVariants({ variant: 'link' }),
          'mx-0 px-0 text-sm font-medium text-gray-900',
        )}
      >
        {name}
        {isActive && (
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
          </span>
        )}
      </Link>
      {name !== id && <div className="text-xs text-gray-500">{id}</div>}
    </div>
  )
}
