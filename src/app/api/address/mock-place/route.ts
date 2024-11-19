import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { mockPlaces } from '~/data/mock-addresses'

export function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const placeId = searchParams.get('placeId')

  if (!placeId) {
    return NextResponse.json(
      { error: 'Missing placeId', data: null },
      { status: 400 },
    )
  }

  const mockPlace = mockPlaces.find((place) => place.placeId === placeId)

  if (!mockPlace) {
    return NextResponse.json(
      { error: 'Place not found', data: null },
      { status: 404 },
    )
  }

  return NextResponse.json({
    data: {
      adrAddress: mockPlace.adrAddress,
      address: mockPlace.address,
    },
    error: null,
  })
}
