/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'

import { supabase } from '~/server/supabase/client'

type SupabaseFile = {
  bucket: string
  name: string
}

async function downloadSupabaseObjects(files: SupabaseFile[]): Promise<any[]> {
  const results: any[] = []

  for (const file of files) {
    try {
      const { data, error } = await supabase.storage
        .from('routes')
        .download(file.name)

      if (error) {
        throw error
      }

      if (data) {
        const arrayBuffer = await data.arrayBuffer()
        const jsonString = new TextDecoder('utf-8').decode(arrayBuffer)
        const jsonObject = JSON.parse(jsonString)

        results.push({ ...jsonObject, routeId: file.name.split('.json')[0] })
      }
    } catch (error) {
      console.error('Error downloading file:', error)
    }
  }

  return results
}

export async function GET(req: NextRequest) {
  try {
    const { data } = await supabase.storage.from('routes').list()

    const filteredData = data?.filter((route) => route.name.includes('.json'))

    const dataArray = await downloadSupabaseObjects(
      filteredData as unknown as SupabaseFile[],
    )

    if (dataArray) {
      return NextResponse.json({ data: dataArray })
    }
  } catch (e) {
    return NextResponse.json({ error: 'Error getting routes' }, { status: 500 })
  }
}
