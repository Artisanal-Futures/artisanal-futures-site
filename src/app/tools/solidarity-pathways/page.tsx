'use client'

import { useEffect } from 'react'

import { DepotModal } from '~/app/tools/solidarity-pathways/_components/settings/depot-modal'
import { useDepotModal } from '~/app/tools/solidarity-pathways/_hooks/depot/use-depot-modal.wip'

export default function SolidarityPathwaysHomePage() {
  const onOpen = useDepotModal((state) => state.onOpen)
  const isOpen = useDepotModal((state) => state.isOpen)

  useEffect(() => {
    if (!isOpen) {
      onOpen()
    }
  }, [isOpen, onOpen])

  return <DepotModal initialData={null} />
}
