/* eslint-disable @typescript-eslint/no-unsafe-return */
import type { NextRequest } from 'next/server'
import NextAuth from 'next-auth'

import { generateAuthOptions } from '~/server/auth'

type RouteHandlerContext = { params: { nextauth: string[] } }

const handler = async (req: NextRequest, context: RouteHandlerContext) => {
  return await NextAuth(req, context, generateAuthOptions(req))
}

export { handler as GET, handler as POST }
