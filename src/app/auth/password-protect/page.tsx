import { cookies } from 'next/headers'
import Image from 'next/image'
import { redirect } from 'next/navigation'

import AuthLayout from '~/layouts/auth-layout'
import { PasswordProtectClient } from '../_components/password-protect-client'

export const metadata = {
  title: 'Password Protect',
}

export default async function PasswordProtectPage({
  searchParams,
}: {
  searchParams: { code?: string }
}) {
  // const code = cookies().get('code')?.value

  // if (code) {
  //   redirect('/auth/sign-up')
  // }

  return (
    <>
      <PasswordProtectClient />
    </>
  )
}
