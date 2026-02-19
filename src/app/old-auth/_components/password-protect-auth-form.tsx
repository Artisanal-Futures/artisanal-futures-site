/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
'use client'

import React, { useState } from 'react'
import {
  useRouter as useNavigationRouter,
  useSearchParams,
} from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import { Button } from '~/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form'
import { Input } from '~/components/ui/input'

const formSchema = z.object({
  password: z.string(),
})

type PassCodeFormValues = z.infer<typeof formSchema>

export const AuthForm = ({ loading }: { loading: boolean }) => {
  const router = useNavigationRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/'

  const [error, setError] = useState<string | null>(null)
  const form = useForm<PassCodeFormValues>({
    resolver: zodResolver(formSchema),
  })

  const onSubmit = async (data: PassCodeFormValues) => {
    const res = await fetch('/api/password-protect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }).then((res) => res.json())

    if (res?.error) {
      setError(res.error as string)
      return
    }

    if (res.success) {
      router.push(
        `/auth/sign-up?callbackUrl=${encodeURIComponent(callbackUrl)}`,
      )
    }
  }

  return (
    <>
      <h1 className="text-3xl font-semibold">
        Enter code to sign up to Artisanal Futures
      </h1>
      <p className="pt-2 font-medium text-muted-foreground">
        Welcome to Artisanal Futures! In order to maintain a truly free and
        collaborative environment, we invite others to join via a pass code. You
        can get a pass code from our admins or from one of our existing members!
      </p>
      <Form {...form}>
        <form
          onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
          className="py-5"
        >
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="sm:col-span-3">
                {error && (
                  <FormLabel className="label">
                    <span className="label-text text-error">{error}</span>
                  </FormLabel>
                )}
                <FormControl>
                  <Input
                    disabled={loading}
                    placeholder="e.g. Secret123"
                    {...field}
                    autoComplete="off"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />{' '}
          <Button
            disabled={loading}
            className="ml-auto mt-5 w-full"
            type="submit"
          >
            Authenticate
          </Button>
        </form>
      </Form>
    </>
  )
}
