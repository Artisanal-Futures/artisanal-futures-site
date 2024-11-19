import type {
  FieldValues,
  Path,
  PathValue,
  UseFormReturn,
} from 'react-hook-form'
import { useEffect, useState } from 'react'

import type { AddressType } from './address-autocomplete'
import { FormDescription, FormItem, FormLabel } from '~/components/ui/form'
import { cn } from '~/utils/styles'
import { AddressAutoComplete } from './address-autocomplete'
import { formatAddress } from './format-address'

type Props<CurrentForm extends FieldValues> = {
  form: UseFormReturn<CurrentForm>
  // name: Path<CurrentForm>;
  names?: Record<string, Path<CurrentForm>>
  label: string
  description?: string
  className?: string
  disabled?: boolean
  placeholder?: string
  defaultValue?: AddressType
}

export const AddressFormField = <CurrentForm extends FieldValues>({
  form,

  // name,
  label,
  description,
  className,

  names = {
    address1: 'street' as Path<CurrentForm>,
    address2: 'additional' as Path<CurrentForm>,
    city: 'city' as Path<CurrentForm>,
    region: 'state' as Path<CurrentForm>,
    postalCode: 'zip' as Path<CurrentForm>,
    country: 'country' as Path<CurrentForm>,
  },
}: Props<CurrentForm>) => {
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
    if (form?.formState?.defaultValues?.[names.address1 as Path<CurrentForm>]) {
      const formatted = formatAddress({
        'street-address':
          form?.formState?.defaultValues?.[
            names.address1 as Path<CurrentForm>
          ] ?? '',
        address2:
          form?.formState?.defaultValues?.[
            names.address2 as Path<CurrentForm>
          ] ?? '',
        locality:
          form?.formState?.defaultValues?.[names.city as Path<CurrentForm>] ??
          '',
        region:
          form?.formState?.defaultValues?.[names.region as Path<CurrentForm>] ??
          '',
        'postal-code':
          form?.formState?.defaultValues?.[
            names.postalCode as Path<CurrentForm>
          ] ?? '',
        country:
          form?.formState?.defaultValues?.[
            names.country as Path<CurrentForm>
          ] ?? '',
      })

      if (formatted) {
        setAddress({
          address1:
            form?.formState?.defaultValues?.[
              names.address1 as Path<CurrentForm>
            ] ?? '',
          address2:
            form?.formState?.defaultValues?.[
              names.address2 as Path<CurrentForm>
            ] ?? '',
          formattedAddress: formatted,
          city:
            form?.formState?.defaultValues?.[names.city as Path<CurrentForm>] ??
            '',
          region:
            form?.formState?.defaultValues?.[
              names.region as Path<CurrentForm>
            ] ?? '',
          postalCode:
            form?.formState?.defaultValues?.[
              names.postalCode as Path<CurrentForm>
            ] ?? '',
          country:
            form?.formState?.defaultValues?.[
              names.country as Path<CurrentForm>
            ] ?? '',
          lat: 0,
          lng: 0,
        })
        setSearchInput(formatted)
      }
    }
  }, [
    form?.formState?.defaultValues,
    form?.formState?.defaultValues?.street,
    names.address1,
    names.address2,
    names.city,
    names.country,
    names.postalCode,
    names.region,
  ])

  useEffect(() => {
    form.setValue(
      names.address1 as Path<CurrentForm>,
      address.address1 as PathValue<CurrentForm, Path<CurrentForm>>,
    )
    form.setValue(
      names.city as Path<CurrentForm>,
      address.city as PathValue<CurrentForm, Path<CurrentForm>>,
    )
    form.setValue(
      names.region as Path<CurrentForm>,
      address.region as PathValue<CurrentForm, Path<CurrentForm>>,
    )
    form.setValue(
      names.postalCode as Path<CurrentForm>,
      address.postalCode as PathValue<CurrentForm, Path<CurrentForm>>,
    )
    form.setValue(
      names.country as Path<CurrentForm>,
      address.country as PathValue<CurrentForm, Path<CurrentForm>>,
    )
    form.setValue(
      names.address2 as Path<CurrentForm>,
      address.address2 as PathValue<CurrentForm, Path<CurrentForm>>,
    )
  }, [
    address,
    form,
    names.address1,
    names.address2,
    names.city,
    names.country,
    names.postalCode,
    names.region,
  ])

  return (
    // <FormField
    //   control={form.control}
    //   name={name}
    //   render={({ field }) => (
    <FormItem className={cn('col-span-full', className)}>
      <FormLabel>{label}</FormLabel>
      <AddressAutoComplete
        address={address}
        setAddress={setAddress}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        dialogTitle="Enter Address"
      />
      {description && <FormDescription>{description}</FormDescription>}
    </FormItem>
    //   )}
    // />
  )
}
