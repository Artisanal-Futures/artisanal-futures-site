'use client'

import { type GuestSurvey } from '@prisma/client'

import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
import { ScrollArea } from '~/components/ui/scroll-area'

interface ViewGuestSurveyDialogProps {
  item: GuestSurvey
}

export function ViewGuestSurveyDialog({ item }: ViewGuestSurveyDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          View Details
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Guest Survey Details</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[80vh]">
          <div className="space-y-6 p-4">
            <div className="space-y-2">
              <h3 className="font-medium">User Information</h3>
              <p className="text-sm text-muted-foreground">Name: {item.name}</p>
              <p className="text-sm text-muted-foreground">
                Email: {item.email}
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Location</h3>
              <p className="text-sm text-muted-foreground">
                Country: {item.country}
              </p>
              <p className="text-sm text-muted-foreground">
                State: {item.state}
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Artisanal Practice</h3>
              <p className="text-sm text-muted-foreground">
                {item.artisanalPractice}
              </p>
            </div>

            {item.otherPractice && (
              <div className="space-y-2">
                <h3 className="font-medium">Other Practice</h3>
                <p className="text-sm text-muted-foreground">
                  {item.otherPractice}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <h3 className="font-medium">Metadata</h3>
              <div className="text-sm text-muted-foreground">
                <p>ID: {item.id}</p>
                <p>Created At: {item.createdAt.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
