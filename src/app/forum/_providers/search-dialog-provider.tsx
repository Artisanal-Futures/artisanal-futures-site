'use client'

import type { ReactNode } from 'react'
import { createContext, useContext, useState } from 'react'

type SearchDialogContextType = {
  isOpen: boolean
  open: () => void
  close: () => void
}

const SearchDialogContext = createContext<SearchDialogContextType | undefined>(
  undefined,
)

export function SearchDialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const open = () => setIsOpen(true)
  const close = () => setIsOpen(false)

  return (
    <SearchDialogContext.Provider value={{ isOpen, open, close }}>
      {children}
    </SearchDialogContext.Provider>
  )
}

export function useSearchDialog() {
  const context = useContext(SearchDialogContext)
  if (context === undefined) {
    throw new Error(
      'useSearchDialog must be used within a SearchDialogProvider',
    )
  }
  return context
}
