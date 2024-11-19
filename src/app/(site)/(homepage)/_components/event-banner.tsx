import { Dialog, DialogContent, DialogTrigger } from '~/components/ui/dialog'

type Props = {
  description: string
  children: React.ReactNode
}

export const EventBanner = ({ description, children }: Props) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="w-full cursor-pointer rounded-md bg-green-400/30 p-2 text-center font-medium shadow hover:bg-green-400/40">
          <p>
            {description} <strong>Click here for details!</strong>
          </p>
        </div>
      </DialogTrigger>
      <DialogContent>
        <div className="grid gap-4 py-4">{children}</div>
      </DialogContent>
    </Dialog>
  )
}
