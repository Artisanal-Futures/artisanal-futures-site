import { NextRequest, NextResponse } from 'next/server'
import * as Papa from 'papaparse'

import { supabase } from '~/server/supabase/client'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const dataType = searchParams.get('dataType')

  try {
    if (dataType === 'customers') {
      const { data: specificData, error: specificError } =
        await supabase.storage.from('routes').download('daz_deliveries.csv')

      if (specificError)
        return NextResponse.json({ error: specificError }, { status: 500 })

      const text = await specificData.text()

      return new Promise((resolve) => {
        Papa.parse(text, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (result) => {
            resolve(NextResponse.json(result))
          },
        })
      })
    }

    if (dataType === 'drivers') {
      const { data: specificData, error: specificError } =
        await supabase.storage.from('routes').download('daz_drivers.csv')

      if (specificError)
        return NextResponse.json({ error: specificError }, { status: 500 })

      const text = await specificData.text()

      return new Promise((resolve) => {
        Papa.parse(text, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (result) => {
            resolve(NextResponse.json(result))
          },
        })
      })
    }

    return NextResponse.json({ error: 'Invalid dataType' }, { status: 400 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Error getting routes' }, { status: 500 })
  }
}
