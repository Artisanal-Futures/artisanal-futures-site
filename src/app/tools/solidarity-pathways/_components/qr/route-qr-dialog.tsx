import type { FC } from 'react'
import { useState } from 'react'
import Link from 'next/link'
import { QrCode } from 'lucide-react'

import 'react-phone-number-input/style.css'

import QRCode from 'qrcode.react'

import LoadingIndicator from '~/app/tools/solidarity-pathways/_components/route-plan-section/loading-indicator'
import { useSolidarityState } from '~/app/tools/solidarity-pathways/_hooks/optimized-data/use-solidarity-state'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'

type Props = { pathId: string }

export const RouteQRDialog: FC<Props> = ({ pathId }) => {
  const { depotId, routeId } = useSolidarityState()

  const [isOpen, setIsOpen] = useState<boolean>(false)

  const finalizedURL = `/tools/solidarity-pathways/${depotId}/route/${routeId}/path/${pathId}`

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button type="button" size="icon" className="gap-2 ">
            <QrCode />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>QR code</DialogTitle>
            <DialogDescription>
              <Link href={finalizedURL} target="_blank">
                Link to generated route
              </Link>
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 h-full w-full">
            {finalizedURL ? (
              <QRCode
                value={finalizedURL}
                renderAs="svg"
                className="h-full w-full"
              />
            ) : (
              <LoadingIndicator />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
