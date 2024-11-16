'use client'

import React from 'react'
import { useRouter as useNavigationRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
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
import { Textarea } from '~/components/ui/textarea'

const emailSchema = z.object({
  email: z.string().email(),
  name: z.string(),
  body: z.string(),
})

type EmailFormValues = z.infer<typeof emailSchema>

export const EmailForm = ({ loading }: { loading: boolean }) => {
  const navigate = useNavigationRouter()

  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: undefined,
      name: undefined,
      body: undefined,
    },
  })

  const onSubmit = async (values: EmailFormValues) => {
    const req = await fetch('/api/send-inquiry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(values),
    })

    // if (req.status === 200) {
    //   toast.success("Email sent.");
    // } else {
    //   toast.error("Something went wrong. Please try again.");
    // }

    const res = await req.json()

    if (res?.statusCode) {
      const error = res?.message ?? 'Something went wrong. Please try again.'
      toast.error(error as string)
      return
    }

    toast.success('Email sent. We will get back to you shortly.')

    navigate.push('/')
    return
  }
  return (
    <>
      <h1 className="text-2xl">Shoot us an email</h1>
      <Form {...form}>
        <form
          onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
          className="py-5"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="sm:col-span-3">
                <FormLabel className="label">
                  <span className="label-text text-error">Email</span>
                </FormLabel>
                <FormControl>
                  <Input
                    disabled={loading}
                    placeholder="e.g. hwest@test.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />{' '}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="sm:col-span-3">
                {' '}
                <FormLabel className="label">
                  <span className="label-text text-error">Name</span>
                </FormLabel>
                <FormControl>
                  <Input
                    disabled={loading}
                    placeholder="e.g. Henry West"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="body"
            render={({ field }) => (
              <FormItem className="sm:col-span-3">
                {' '}
                <FormLabel className="label">
                  <span className="label-text text-error">Body</span>
                </FormLabel>
                <FormControl>
                  <Textarea
                    disabled={loading}
                    placeholder="e.g. Hey! I am interested in joining the collective!"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />{' '}
          <Button className="ml-auto" type="submit">
            Email Us
          </Button>
        </form>
      </Form>
    </>
  )
}
