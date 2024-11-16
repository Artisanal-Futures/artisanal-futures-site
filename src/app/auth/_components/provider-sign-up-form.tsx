'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'

import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'

type Props = {
  children: ReactNode
  storeName: string
}
export function ProviderSignUpForm({ children, storeName }: Props) {
  return (
    <>
      <CardHeader>
        <CardTitle className="text-center text-2xl">
          Sign Up to {storeName}
        </CardTitle>
        <CardDescription className="text-center">
          Sign up to your account using one of the providers below
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="flex w-full gap-2">{children}</div>
        </div>

        <p className="w-full py-4 text-center font-medium text-muted-foreground">
          Already have an account?{' '}
          <Link href={'/auth/sign-in'} className="underline">
            <span className="font-bold hover:text-slate-800">Sign in</span>
          </Link>
        </p>
      </CardContent>
    </>
  )
}
