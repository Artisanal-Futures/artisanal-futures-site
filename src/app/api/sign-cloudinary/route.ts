import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import { getServerSession } from 'next-auth/next'

import { env } from '~/env'
import { authOptions } from '~/server/auth'

type Data = {
  timestamp: number
  folder: string
  signature: string
  apiKey: string
  cloudName: string
}

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
})

const cloudName = cloudinary.config().cloud_name!
const apiSecret = cloudinary.config().api_secret!
const apiKey = cloudinary.config().api_key!
const folder = 'beam'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const timestamp = Math.round(new Date().getTime() / 1000)
  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      folder,
      image_metadata: true,
    },
    apiSecret,
  )

  return NextResponse.json({ timestamp, folder, signature, apiKey, cloudName })
}

export function GET() {
  return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 })
}
