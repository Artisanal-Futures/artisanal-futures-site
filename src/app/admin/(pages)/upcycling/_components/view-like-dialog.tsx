'use client'

import { ThumbsDown, ThumbsUp } from 'lucide-react'

import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
import { ScrollArea } from '~/components/ui/scroll-area'
import { type UpcyclingItem } from '~/types'

interface ViewLikeDialogProps {
  item: UpcyclingItem
}

export function ViewLikeDialog({ item }: ViewLikeDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 h-8">
          {item.like === null
            ? '(No Like)'
            : item.like.is_liked
              ? '(Liked)'
              : '(Disliked)'}
          {item.like?.is_liked && (
            <ThumbsUp className="size-4 text-green-500 bg-green-500/10 rounded-full" />
          )}
          {item.like?.is_liked === false && (
            <ThumbsDown className="size-4 text-red-500 bg-red-500/10 rounded-full" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Like Details for {item.project_title}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[80vh]">
          <div className="space-y-6 p-4">
            {item.like ? (
              <>
                <div className="space-y-2">
                  <h3 className="font-medium">Like Status</h3>
                  <p className="text-sm text-muted-foreground">
                    {item.like.is_liked ? 'Liked' : 'Not Liked'}
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium">Moderation Category</h3>
                  <p className="text-sm text-muted-foreground">
                    {item.like.mod_category}
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium">Liked At</h3>
                  <p className="text-sm text-muted-foreground">
                    {item.like.liked_at.toLocaleString()}
                  </p>
                </div>

                {item.like.reason && (
                  <div className="space-y-2">
                    <h3 className="font-medium">Reason</h3>
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                      {item.like.reason}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No like information available
              </p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
