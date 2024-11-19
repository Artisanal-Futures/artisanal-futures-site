import { NextResponse } from 'next/server'

import { mockAddresses } from '~/data/mock-addresses'

export function GET() {
  return NextResponse.json({ data: mockAddresses, error: null })
}
