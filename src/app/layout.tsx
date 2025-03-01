import '~/styles/globals.css'

import { type Metadata } from 'next'
import { Toaster } from '@dreamwalker-studios/toasts'
import { GeistSans } from 'geist/font/sans'
import { getServerSession } from 'next-auth'
import NextTopLoader from 'nextjs-toploader'

import { ModalProvider } from '~/providers/modal-provider'
import { ThemeProvider } from '~/providers/theme-provider'
import { authOptions } from '~/server/auth'
import { TRPCReactProvider } from '~/trpc/react'
import SessionProviderClientComponent from './auth/_components/session-provider-client-component'

export const metadata: Metadata = {
  title: {
    template: '%s - Artisanal Futures',
    default: 'Artisanal Futures',
  },
  description:
    'Shop worker-owned stores, share knowledge and tech, & participate in the transition to a decolonized circular economy.',
  icons: [{ rel: 'icon', url: '/favicon.ico' }],
}

type Props = {
  children: React.ReactNode
}

export default async function RootLayout({ children }: Props) {
  const session = await getServerSession(authOptions)
  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      <body>
        <SessionProviderClientComponent session={session}>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <TRPCReactProvider>
              <NextTopLoader />
              {children}
              <Toaster />
              <ModalProvider />
            </TRPCReactProvider>
          </ThemeProvider>
        </SessionProviderClientComponent>
      </body>
    </html>
  )
}
