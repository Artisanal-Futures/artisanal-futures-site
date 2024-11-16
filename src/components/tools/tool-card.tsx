'use client'

/* eslint-disable @next/next/no-img-element */
import type { FC } from 'react'
import { useState } from 'react'
import Link from 'next/link'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'

interface IAppCardProps {
  title: string
  subtitle: string
  image: string
  url: string
  type?: string
}

const ToolCard: FC<IAppCardProps> = ({ title, subtitle, image, url }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    if (title.toLowerCase().includes('in progress')) {
      e.preventDefault()
      setIsDialogOpen(true)
    }
  }

  return (
    <>
      <Link
        className="group h-full cursor-pointer"
        href={url}
        target={url.includes('.app') || url.includes('.dev') ? '_blank' : ''}
        onClick={handleClick}
      >
        <div className="md:max-w-s mx-auto my-3 flex h-full w-10/12 flex-col items-center overflow-hidden rounded-lg shadow-lg transition-all duration-200 group-hover:bg-slate-500 group-active:shadow-lg group-active:shadow-blue-200 lg:max-w-xs ">
          <img
            className="aspect-square w-full rounded-t-lg object-cover transition-all duration-200 group-hover:contrast-75"
            src={image}
            alt={title}
          />
          <div className="w-full px-4 py-2 ">
            <h1 className="text-xl font-semibold text-gray-700 transition-all duration-200 group-hover:text-white">
              {title}
            </h1>
            <p className="mt-1 text-sm text-gray-500 transition-all duration-200 group-hover:text-white">
              {subtitle}
            </p>
          </div>
        </div>
      </Link>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Application Update in Progress</DialogTitle>
          </DialogHeader>
          <p>
            We are currently in the process of updating the application. Please
            check back later to use the app.
          </p>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ToolCard
