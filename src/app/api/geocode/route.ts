import { NextRequest, NextResponse } from 'next/server'

import geocodingService from '~/app/tools/solidarity-pathways/_services/autocomplete'

export async function POST(req: NextRequest) {
  try {
    const { address } = await req.json()

    const apiResponse = await geocodingService.fetchDataFromGeoEndpoint(
      address as string,
    )

    return NextResponse.json(apiResponse)
  } catch (error) {
    return NextResponse.json(error, { status: 400 })
  }
}

export function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
