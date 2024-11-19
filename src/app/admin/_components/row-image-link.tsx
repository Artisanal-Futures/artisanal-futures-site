'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { type LucideIcon } from 'lucide-react'

import { Button } from '~/components/ui/button'

type Props = {
  id: string
  name: string
  image?: string
  Icon?: LucideIcon
  isActive?: boolean
}

export const RowImageLink = ({ id, name, image, Icon, isActive }: Props) => {
  const pathname = usePathname()

  return (
    <div className="group flex w-full items-center gap-2">
      <div className="relative aspect-square h-10 rounded-lg border border-border shadow-sm">
        <Image
          src={image ?? '/placeholder-image.webp'}
          fill
          className="rounded-lg"
          alt=""
        />
      </div>
      <Link className="text-sm text-gray-500" href={`${pathname}/${id}/edit`}>
        <Button variant={'link'} className="mx-0 px-0">
          {Icon && <Icon className="mr-2 h-4 w-4" />}
          {name}
          {isActive && <span className="rounded-full text-lg text-green-500" />}
        </Button>
      </Link>
    </div>
  )
}
