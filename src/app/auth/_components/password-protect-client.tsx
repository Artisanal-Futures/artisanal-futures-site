'use client'

import { useState } from 'react'

import { Button } from '~/components/ui/button'
import { AuthForm } from './password-protect-auth-form'
import { EmailForm } from './password-protect-email-form'

export const PasswordProtectClient = () => {
  const [emailView, setEmailView] = useState(false)
  return (
    <div className="justify-left flex w-full flex-col gap-y-3 ">
      {!emailView && <AuthForm loading={false} />}
      {emailView && <EmailForm loading={false} />}
      <Button variant={'link'} onClick={() => setEmailView(!emailView)}>
        {emailView
          ? 'Have a code? Enter it here.'
          : "Don't have a code? Get in contact with us!"}
      </Button>
    </div>
  )
}
