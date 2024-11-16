import { NextRequest, NextResponse } from 'next/server'

import { supabase } from '~/server/supabase/client'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const fetchAll = searchParams.get('fetchAll')
    const specificData = searchParams.get('data')

    if (fetchAll) {
      const { data } = await supabase.storage.from('routes').list()
      return NextResponse.json(data)
    }

    if (specificData) {
      const { data, error } = await supabase.storage
        .from('routes')
        .download(`${specificData}.json`)

      if (error) {
        return NextResponse.json({ error }, { status: 500 })
      }

      const arrayBuffer = await data.arrayBuffer()
      const jsonString = new TextDecoder('utf-8').decode(arrayBuffer)
      const jsonObject = JSON.parse(jsonString)

      return NextResponse.json({ data: jsonObject })
    }

    const { data } = await supabase.storage.from('routes').list()
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: 'Error getting routes' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { file, fileName } = await req.json()

    // Convert the object to a string
    const dataString = JSON.stringify(file, null, 2) // pretty print the JSON

    // Convert string to base64
    const base64Data = Buffer.from(dataString, 'utf8').toString('base64')

    // Convert base64 to ArrayBuffer
    const dataBuffer = Uint8Array.from(atob(base64Data), (c) =>
      c.charCodeAt(0),
    ).buffer

    const { data, error } = await supabase.storage
      .from('routes')
      .upload(`${fileName}.json`, dataBuffer)

    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ data })
  } catch (e) {
    console.log(e)
    return NextResponse.json({ error: e }, { status: 500 })
  }
}
