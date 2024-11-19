'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { AbsolutePageLoader } from '~/components/absolute-page-loader'
import { InputFormField } from '~/components/inputs/input-form-field'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Form } from '~/components/ui/form'
import { Label } from '~/components/ui/label'
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group'
import { toastService } from '~/services/toasts'
import { api } from '~/trpc/react'

const GuestSchema = z.object({
  name: z.string(),
  country: z.string(),
  state: z.string(),
  artisanalPractice: z.string(),
  otherPractice: z.string(),
  email: z.string().email(),
})

export default function ArtisanRegistrationForm() {
  const apiUtils = api.useUtils()
  const sessionData = useSession()

  const { data: isCompleted, isPending } = api.guest.isCompleted.useQuery()

  const form = useForm<z.infer<typeof GuestSchema>>({
    resolver: zodResolver(GuestSchema),
    defaultValues: {
      name: '',
      country: '',
      state: '',
      artisanalPractice: '',
      otherPractice: '',
      email: sessionData.data?.user?.email ?? '',
    },
  })

  const guestRegistrationMutation = api.guest.create.useMutation({
    onSuccess: ({ message }) => {
      toastService.success({ message })
    },
    onError: (error) => {
      toastService.error({
        error,
        message: 'There was an issue submitting the survey. Please try again.',
      })
    },
    onSettled: () => void apiUtils.guest.invalidate(),
  })

  const handleSubmit = (data: z.infer<typeof GuestSchema>) => {
    guestRegistrationMutation.mutate(data)
    // Here you would typically send the data to your server
  }

  if (isPending) return <AbsolutePageLoader />

  if (isCompleted) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Thank You!</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            Thanks for completing the survey. Make sure to check your email for
            more details.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Guest Registration</CardTitle>
        <CardDescription>
          Welcome! Please fill out the form below to register as a guest.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={(e) => void form.handleSubmit(handleSubmit)(e)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <InputFormField
                form={form}
                name="name"
                label="Name"
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-2">
              <InputFormField
                form={form}
                name="country"
                label="Country"
                placeholder="Enter your country"
              />
            </div>

            <div className="space-y-2">
              <InputFormField
                form={form}
                name="state"
                label="State"
                placeholder="Enter your state"
              />
            </div>

            <div className="space-y-2">
              <Label>Artisanal Practices</Label>
              <RadioGroup
                onValueChange={(value) =>
                  form.setValue('artisanalPractice', value)
                }
                value={form.watch('artisanalPractice')}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cloth" id="cloth" />
                  <Label htmlFor="cloth">Cloth designer</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="bag" id="bag" />
                  <Label htmlFor="bag">Bag Designer</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="both" id="both" />
                  <Label htmlFor="both">Cloth and Bag Designer</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other">Others</Label>
                </div>
              </RadioGroup>
            </div>

            {form.watch('artisanalPractice') === 'other' && (
              <div className="space-y-2">
                <InputFormField
                  form={form}
                  name="otherPractice"
                  label="Other Practice"
                  placeholder="Enter your artisanal practice"
                />
              </div>
            )}

            <div className="space-y-2">
              <InputFormField
                form={form}
                name="email"
                label="Email"
                placeholder="Enter your email address"
                disabled={!!sessionData?.data?.user?.email}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">
              Register
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
