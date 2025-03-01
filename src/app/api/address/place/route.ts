/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import type { AddressType } from '~/components/inputs/address-autocomplete'
import { env } from '~/env'

export async function GET(request: NextRequest) {
  const apiKey = env.GOOGLE_PLACES_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Missing API Key', data: null },
      { status: 500 },
    )
  }

  const { searchParams } = new URL(request.url)
  const placeId = searchParams.get('placeId')

  if (!placeId) {
    return NextResponse.json(
      { error: 'Missing placeId', data: null },
      { status: 400 },
    )
  }

  const url = `https://places.googleapis.com/v1/${placeId}`

  try {
    const response = await fetch(url, {
      headers: {
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask':
          // Include expected fields in the response
          'adrFormatAddress,shortFormattedAddress,formattedAddress,location,addressComponents',
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    const dataFinderRegx = (c: string) => {
      const regx = new RegExp(`<span class="${c}">([^<]+)<\/span>`)
      const match = data.adrFormatAddress.match(regx)
      return match ? match[1] : ''
    }

    const address1 = dataFinderRegx('street-address')
    const address2 = ''
    const city = dataFinderRegx('locality')
    const region = dataFinderRegx('region')
    const postalCode = dataFinderRegx('postal-code')
    const country = dataFinderRegx('country-name')
    const lat = data.location.latitude
    const lng = data.location.longitude

    const formattedAddress = data.formattedAddress

    const formattedData: AddressType = {
      address1,
      address2,
      formattedAddress,
      city,
      region,
      postalCode,
      country,
      lat,
      lng,
    }
    return NextResponse.json({
      data: {
        address: formattedData,
        adrAddress: data.adrFormatAddress,
      },
      error: null,
    })
  } catch (err) {
    console.error('Error fetching place details:', err)
    return NextResponse.json(
      { error: (err as Error).message || 'Unknown error', data: null },
      { status: 500 },
    )
  }
}
