import type { ReactNode } from 'react'
import * as React from 'react'
import { redirect } from 'next/navigation'

import Container from '~/app/_components/container'
import { Footer } from '~/app/forum/_components/footer'
import Navbar from '~/app/forum/_components/navbar'
import { SearchDialog } from '~/app/forum/_components/search-dialog'
import { env } from '~/env'
import { getServerAuthSession } from '~/server/auth'
import { SearchDialogProvider } from './_providers/search-dialog-provider'

type Props = { children: ReactNode }

export const metadata = {
  title: 'Forums',
}

export default async function ForumLayout({ children }: Props) {
  const session = await getServerAuthSession()

  if (!session) {
    redirect(
      `/auth/sign-in?callbackUrl=${encodeURIComponent(
        `${env.NEXTAUTH_URL}/forum`,
      )}`,
    )
  }

  return (
    <main className="flex min-h-screen flex-col">
      <SearchDialogProvider>
        <Container>
          <Navbar />
        </Container>

        <Container className="flex h-full flex-grow flex-col items-stretch  p-8">
          <div className="flex flex-row gap-4">
            <div className="w-5/6">{children}</div>
          </div>
        </Container>
        <Container className="py-20">
          <Footer />
        </Container>
        <SearchDialog />
      </SearchDialogProvider>
    </main>
  )
}
