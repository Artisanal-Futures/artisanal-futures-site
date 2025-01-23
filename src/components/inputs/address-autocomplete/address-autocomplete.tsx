/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
'use client'

import { useCallback, useEffect, useState } from 'react'
import { Command as CommandPrimitive } from 'cmdk'
import { Delete, Loader2, Pencil } from 'lucide-react'
import useSWR from 'swr'

import { Button } from '~/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandList,
} from '~/components/ui/command'
import { Input } from '~/components/ui/input'
import { useDebounce } from '~/hooks/use-debounce'
import AddressDialog from './address-dialog'
import { fetcher } from './fetcher'
import { FormMessages } from './form-messages'

export interface AddressType {
  address1: string
  address2: string
  formattedAddress: string
  city: string
  region: string
  postalCode: string
  country: string
  lat: number
  lng: number
}

interface AddressAutoCompleteProps {
  address: AddressType
  setAddress: (address: AddressType) => void
  searchInput: string
  setSearchInput: (searchInput: string) => void
  dialogTitle: string
  showInlineError?: boolean
  placeholder?: string
  formReset?: boolean
}

export function AddressAutoComplete(props: AddressAutoCompleteProps) {
  const {
    address,
    setAddress,
    dialogTitle,
    showInlineError = true,
    searchInput,
    setSearchInput,
    placeholder,
  } = props

  const [selectedPlaceId, setSelectedPlaceId] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const [, setError] = useState<string | null>(null)

  const { data, isLoading } = useSWR(
    // For real use case: /api/address/place?placeId=${selectedPlaceId}
    selectedPlaceId === ''
      ? null
      : // : `/api/address/mock-place?placeId=${selectedPlaceId}`,
        ` /api/address/place?placeId=${selectedPlaceId}`,
    fetcher,
    {
      revalidateOnFocus: false,
    },
  )

  useEffect(() => {
    // console.log(address.formattedAddress, selectedPlaceId);
    const fetchPlaceId = async () => {
      if (!!address.formattedAddress && !selectedPlaceId) {
        try {
          const response = await fetch(
            `/api/address/autocomplete?input=${encodeURIComponent(
              address.formattedAddress,
            )}`,
          )
          const result = await response.json()

          const guestimateId = result.data[0].placePrediction.place

          if (result.error) {
            setError((result.error as string) ?? 'Error trying to find placeid')
          } else if (!!guestimateId) {
            setSelectedPlaceId(guestimateId as string)
            // void mutate(`/api/address/place?placeId=${result?.data?.placeId}`);
            setError(null)
          }
        } catch (err) {
          setError('Failed to fetch place ID')
          console.error('Error fetching place ID:', err)
        }
      }
    }

    void fetchPlaceId()
  }, [address.formattedAddress, selectedPlaceId])

  const adrAddress = data?.data?.adrAddress

  useEffect(() => {
    if (data?.data?.address) {
      setAddress(data.data.address as AddressType)
    }
  }, [data, setAddress])

  return (
    <>
      {selectedPlaceId !== '' || address.formattedAddress ? (
        <div className="flex items-center gap-2">
          <Input value={address?.formattedAddress} readOnly />

          {!!adrAddress && (
            <AddressDialog
              isLoading={isLoading}
              dialogTitle={dialogTitle}
              adrAddress={adrAddress}
              address={address}
              setAddress={setAddress}
              open={isOpen}
              setOpen={setIsOpen}
            >
              <Button
                disabled={isLoading}
                size="icon"
                variant="outline"
                type="button"
                className="shrink-0"
              >
                <Pencil className="size-4" />
              </Button>
            </AddressDialog>
          )}
          <Button
            type="reset"
            onClick={() => {
              setSelectedPlaceId('')
              setAddress({
                address1: '',
                address2: '',
                formattedAddress: '',
                city: '',
                region: '',
                postalCode: '',
                country: '',
                lat: 0,
                lng: 0,
              })
            }}
            size="icon"
            variant="outline"
            className="shrink-0"
          >
            <Delete className="size-4" />
          </Button>
        </div>
      ) : (
        <AddressAutoCompleteInput
          searchInput={searchInput}
          setSearchInput={setSearchInput}
          selectedPlaceId={selectedPlaceId}
          setSelectedPlaceId={setSelectedPlaceId}
          setIsOpenDialog={setIsOpen}
          showInlineError={showInlineError}
          placeholder={placeholder}
        />
      )}
    </>
  )
}

interface CommonProps {
  selectedPlaceId: string
  setSelectedPlaceId: (placeId: string) => void
  setIsOpenDialog: (isOpen: boolean) => void
  showInlineError?: boolean
  searchInput: string
  setSearchInput: (searchInput: string) => void
  placeholder?: string
}

function AddressAutoCompleteInput(props: CommonProps) {
  const {
    setSelectedPlaceId,
    selectedPlaceId,
    setIsOpenDialog,
    showInlineError,
    searchInput,
    setSearchInput,
    placeholder,
  } = props

  const [isOpen, setIsOpen] = useState(false)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      close()
    }
  }

  const debouncedSearchInput = useDebounce(searchInput, 500)

  const { data, isLoading } = useSWR(
    // For real use case: /api/address/autocomplete?input=${debouncedSearchInput}
    // `/api/address/mock-autocomplete?input=${debouncedSearchInput}`,
    `/api/address/autocomplete?input=${debouncedSearchInput}`,
    fetcher,
  )

  const predictions = data?.data || []

  return (
    <Command
      shouldFilter={false}
      onKeyDown={handleKeyDown}
      className="overflow-visible"
    >
      <div className="flex w-full items-center justify-between rounded-lg border bg-background text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        <CommandPrimitive.Input
          value={searchInput}
          onValueChange={setSearchInput}
          onBlur={close}
          onFocus={open}
          placeholder={placeholder ?? 'Enter address'}
          className="w-full rounded-lg p-3 outline-none"
        />
      </div>
      {searchInput !== '' && !isOpen && !selectedPlaceId && showInlineError && (
        <FormMessages
          type="error"
          className="pt-1 text-sm"
          messages={['Select a valid address from the list']}
        />
      )}

      {isOpen && (
        <div className="relative h-auto animate-in fade-in-0 zoom-in-95">
          <CommandList>
            <div className="absolute top-1.5 z-50 w-full">
              <CommandGroup className="relative z-50 h-auto min-w-[8rem] overflow-hidden rounded-md border bg-background shadow-md">
                {isLoading ? (
                  <div className="flex h-28 items-center justify-center">
                    <Loader2 className="size-6 animate-spin" />
                  </div>
                ) : (
                  <>
                    {predictions.map(
                      (prediction: {
                        placePrediction: {
                          placeId: string
                          place: string
                          text: { text: string }
                        }
                      }) => (
                        <CommandPrimitive.Item
                          value={prediction.placePrediction.text.text}
                          onSelect={() => {
                            setSearchInput('')
                            setSelectedPlaceId(prediction.placePrediction.place)
                            setIsOpenDialog(true)
                          }}
                          className="flex h-max cursor-pointer select-text flex-col items-start gap-0.5 rounded-md p-2 px-3 hover:bg-accent hover:text-accent-foreground aria-selected:bg-accent aria-selected:text-accent-foreground"
                          key={prediction.placePrediction.placeId}
                          onMouseDown={(e) => e.preventDefault()}
                        >
                          {prediction.placePrediction.text.text}
                        </CommandPrimitive.Item>
                      ),
                    )}
                  </>
                )}

                <CommandEmpty>
                  {!isLoading && predictions.length === 0 && (
                    <div className="flex items-center justify-center py-4">
                      {searchInput === ''
                        ? 'Please enter an address'
                        : 'No address found'}
                    </div>
                  )}
                </CommandEmpty>
              </CommandGroup>
            </div>
          </CommandList>
        </div>
      )}
    </Command>
  )
}
