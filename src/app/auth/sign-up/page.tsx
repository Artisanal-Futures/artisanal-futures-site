import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { env } from '~/env'
import { getServerAuthSession } from '~/server/auth'
import {
  ErrorText,
  ProviderSignInButton,
  ProviderSignInForm,
} from '../_components'
import { ProviderSignUpForm } from '../_components/provider-sign-up-form'

export const metadata = {
  title: 'Sign In ',
}

type Props = {
  searchParams: { code: string }
}
export default function SignUpPage({ searchParams }: Props) {
  // const session = await getServerAuthSession()
  // if (session) redirect('/')

  // console.log(searchParams)
  // const urlCode = searchParams?.code

  // if (!urlCode) redirect('/auth/password-protect')

  // if (urlCode) {
  //   const twoMinutes = 60 * 2000

  //   cookies().set('code', urlCode, {
  //     path: '/',
  //     httpOnly: true,
  //     expires: new Date(Date.now() + twoMinutes),
  //   })
  // }

  const providers = [
    {
      id: 'discord',
      name: 'Discord',
    },
    {
      id: 'google',
      name: 'Google',
    },
    {
      id: 'auth0',
      name: 'Auth0',
    },
  ]

  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <ErrorText />
      </Suspense>

      <ProviderSignUpForm storeName={'Artisanal Futures'}>
        <Suspense fallback={<div>Loading...</div>}>
          {providers &&
            Object.values(providers).map((provider) => {
              if (
                provider.name !== 'Auth0' &&
                provider.name !== 'Credentials'
              ) {
                return (
                  <ProviderSignInButton
                    id={provider.id}
                    name={provider.name}
                    key={provider.name}
                  />
                )
              }
            })}
        </Suspense>
      </ProviderSignUpForm>
    </>
  )
}
