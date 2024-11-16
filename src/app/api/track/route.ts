import { NextRequest, NextResponse } from 'next/server'

import { supabase } from '~/server/supabase/client'

export async function GET(request: NextRequest) {
  try {
    const { data } = await supabase.from('coordinates').select('*')

    //   if (request.nextUrl.searchParams.get("data")) {
    //     const dataParam = request.nextUrl.searchParams.get("data");
    //     const { data: specificData, error: specificError } =
    //       await supabase.storage
    //         .from("routes")
    //         .download(`${dataParam}.json`);

    //     if (specificError)
    //       return NextResponse.json({ error: specificError }, { status: 500 });

    //     const arrayBuffer = await specificData.arrayBuffer();
    //     const jsonString = new TextDecoder("utf-8").decode(arrayBuffer);
    //     const jsonObject = JSON.parse(jsonString);

    //     return NextResponse.json({ data: jsonObject });
    //   }
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: 'Error getting routes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { file, fileName } = await request.json()

    // Convert the object to a string
    const dataString = JSON.stringify(file, null, 2) // pretty print the JSON

    // Convert string to base64
    const base64Data = Buffer.from(dataString, 'utf8').toString('base64')

    // Convert base64 to ArrayBuffer
    const dataBuffer = Uint8Array.from(atob(base64Data), (c) =>
      c.charCodeAt(0),
    ).buffer
    console.log(fileName)
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
