'use client'

import { useEffect } from 'react'
import { PlusCircle } from 'lucide-react'

import { Button } from '~/components/ui/button'
import { useShopModal } from '~/hooks/use-shop-modal'

export function ShopModalTrigger() {
  const onOpen = useShopModal((state) => state.onOpen)

  useEffect(() => {
    onOpen()
  }, [onOpen])

  return (
    <Button onClick={onOpen} type="button">
      <PlusCircle className="mr-2 h-5 w-5" />
      Create Store
    </Button>
  )
}
