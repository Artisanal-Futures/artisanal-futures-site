import { QuestionMarkCircledIcon } from '@radix-ui/react-icons'

import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'

export function ShopHelpDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-8 text-xs" size={'sm'}>
          <QuestionMarkCircledIcon className="mr-1 h-4 w-4" /> Help
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Need help with shops?</DialogTitle>
          <DialogDescription>
            Here&apos;s what you need to know about managing shops:
          </DialogDescription>
        </DialogHeader>
        <div className="prose">
          <p>
            Shops represent vendor profiles in the system. Each shop requires
            some basic information:
          </p>
          <ul>
            <li>Shop name - The business name of the vendor</li>
            <li>Owner name - The name of the shop owner</li>
            <li>Description - Details about the shop and what they offer</li>
            <li>Contact information - Website, email, phone number</li>
            <li>Location - Address, city, state, country details</li>
          </ul>
          <p>
            You can create, edit and delete shops as needed. Make sure to fill
            out as much information as possible to help customers find and
            connect with the vendors.
          </p>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
