import { NextRequest, NextResponse } from 'next/server'

import { supabase } from '~/server/supabase/client'

export async function POST(req: NextRequest) {
  try {
    const { routeId } = await req.json()

    const {} = await supabase.storage.from('routes').download(`${routeId}.json`)

    const { data, error } = await supabase.storage
      .from('routes')
      .move(`${routeId}.json`, `archive/${routeId}.json`)

    console.log(data, error)
    return NextResponse.json({ data, error })
  } catch (e) {
    return NextResponse.json(
      { error: 'Error archiving route' },
      { status: 500 },
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const fetchAll = url.searchParams.get('fetchAll')
    const specificData = url.searchParams.get('data')

    if (fetchAll) {
      const { data } = await supabase.storage.from('routes').list('archive')
      return NextResponse.json(data)
    }

    if (specificData) {
      const { data, error } = await supabase.storage
        .from('routes')
        .download(`archive/${specificData}.json`)

      if (error) {
        return NextResponse.json({ error }, { status: 500 })
      }

      const arrayBuffer = await data.arrayBuffer()
      const jsonString = new TextDecoder('utf-8').decode(arrayBuffer)
      const jsonObject = JSON.parse(jsonString)

      return NextResponse.json({ data: jsonObject })
    }

    const { data } = await supabase.storage.from('routes').list('archive')
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: 'Error getting routes' }, { status: 500 })
  }
}
