'use client'

import type {
  FieldPath,
  FieldValues,
  PathValue,
  UseFormReturn,
} from 'react-hook-form'
import { useEffect, useState } from 'react'

import type { AddressType } from './address-autocomplete'
import { AddressAutoComplete } from './address-autocomplete'
import { formatAddress } from './format-address'

type Props<FormData extends FieldValues> = {
  form: UseFormReturn<FormData>
  defaultValue?: AddressType
}
export const AddressAutoCompleteInput = <FormData extends FieldValues>(
  props: Props<FormData>,
) => {
  const [address, setAddress] = useState<AddressType>({
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

  const [searchInput, setSearchInput] = useState('')

  useEffect(() => {
    if (props?.form?.formState?.defaultValues?.street) {
      const formatted = formatAddress({
        'street-address': props?.form?.formState?.defaultValues?.street ?? '',
        address2: props?.form?.formState?.defaultValues?.additional ?? '',
        locality: props?.form?.formState?.defaultValues?.city ?? '',
        region: props?.form?.formState?.defaultValues?.state ?? '',
        'postal-code': props?.form?.formState?.defaultValues?.zip ?? '',
        country: props?.form?.formState?.defaultValues?.country ?? '',
      })

      if (formatted) {
        setAddress({
          address1: props?.form?.formState?.defaultValues?.street,
          address2: props?.form?.formState?.defaultValues?.additional ?? '',
          formattedAddress: formatted,
          city: props?.form?.formState?.defaultValues?.city ?? '',
          region: props?.form?.formState?.defaultValues?.state ?? '',
          postalCode: props?.form?.formState?.defaultValues?.zip ?? '',
          country: props?.form?.formState?.defaultValues?.country ?? '',
          lat: 0,
          lng: 0,
        })
        setSearchInput(formatted)
      }
    }
  }, [
    props?.form?.formState?.defaultValues?.additional,
    props?.form?.formState?.defaultValues?.city,
    props?.form?.formState?.defaultValues?.country,
    props?.form?.formState?.defaultValues?.state,
    props?.form?.formState?.defaultValues?.street,
    props?.form?.formState?.defaultValues?.zip,
  ])

  useEffect(() => {
    props.form.setValue(
      'street' as FieldPath<FormData>,
      address.address1 as PathValue<FormData, FieldPath<FormData>>,
    )
    props.form.setValue(
      'city' as FieldPath<FormData>,
      address.city as PathValue<FormData, FieldPath<FormData>>,
    )
    props.form.setValue(
      'state' as FieldPath<FormData>,
      address.region as PathValue<FormData, FieldPath<FormData>>,
    )
    props.form.setValue(
      'zip' as FieldPath<FormData>,
      address.postalCode as PathValue<FormData, FieldPath<FormData>>,
    )
    props.form.setValue(
      'country' as FieldPath<FormData>,
      address.country as PathValue<FormData, FieldPath<FormData>>,
    )
    props.form.setValue(
      'additional' as FieldPath<FormData>,
      address.address2 as PathValue<FormData, FieldPath<FormData>>,
    )
  }, [address, props.form])

  return (
    <AddressAutoComplete
      address={address}
      setAddress={setAddress}
      searchInput={searchInput}
      setSearchInput={setSearchInput}
      dialogTitle="Enter Address"
    />
  )
}
