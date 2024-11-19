import Image from 'next/image'

import { Dialog, DialogContent, DialogTrigger } from '~/components/ui/dialog'

type Props = { imageUrl: string }

export const EventPopup = ({ imageUrl }: Props) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <strong className="cursor-pointer hover:text-slate-700">
          Click here for details!
        </strong>
      </DialogTrigger>
      <DialogContent>
        <div className="grid gap-4 py-4">
          <Image
            width={200}
            height={160}
            src={imageUrl}
            alt="Details "
            className="aspect-auto w-full "
            loading="lazy"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
