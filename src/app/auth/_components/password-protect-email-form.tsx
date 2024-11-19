'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
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
import { Textarea } from '~/components/ui/textarea'
import { toastService } from '~/services/toasts'
import { api } from '~/trpc/react'

const emailSchema = z.object({
  email: z.string().email(),
  name: z.string(),
  body: z.string(),
})

type EmailFormValues = z.infer<typeof emailSchema>

export const EmailForm = ({ loading }: { loading: boolean }) => {
  const router = useRouter()

  const sendInquiryMutation = api.guest.sendInquiry.useMutation({
    onSuccess: ({ message }) => {
      toastService.success({ message })
      router.push('/')
    },
    onError: (error) => {
      toastService.error({ message: error.message })
    },
  })

  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: undefined,
      name: undefined,
      body: undefined,
    },
  })

  const onSubmit = (values: EmailFormValues) => {
    sendInquiryMutation.mutate(values)
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
