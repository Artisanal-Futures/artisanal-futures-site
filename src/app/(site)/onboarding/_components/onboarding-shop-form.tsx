'use client'

import type { Shop } from '@prisma/client'
import { useEffect, useState } from 'react'
import { toastService } from '@dreamwalker-studios/toasts'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import { EditSection } from '~/components/sections/edit-section.admin'
import { Button } from '~/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import LogoUpload from '~/components/ui/logo-upload'
import { Textarea } from '~/components/ui/textarea'
import { api } from '~/trpc/react'
import { AdminFormBody } from './admin-form-body'
import { AdminFormHeader } from './admin-form-header'

const formSchema = z.object({
  shopName: z.string().min(2),
  ownerName: z.string(),
  bio: z.string().optional(),
  description: z.string().optional(),
  logoPhoto: z.string().optional(),
  ownerPhoto: z.string().optional(),
  address: z.string().optional(),
  additional: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  website: z.string().optional(),
})

type SettingsFormValues = z.infer<typeof formSchema>

interface SettingsFormProps {
  initialData: Shop | null
  onboardingView?: boolean
  successCallback?: () => void
}

export const OnboardingShopForm: React.FC<SettingsFormProps> = ({
  initialData,
  successCallback,
}) => {
  const apiContext = api.useUtils()

  const { data: sessionData } = useSession()

  const [loading, setLoading] = useState(false)

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      shopName: initialData?.shopName ?? '',
      ownerName: initialData?.ownerName ?? '',
      bio: initialData?.bio ?? '',
      description: initialData?.description ?? '',
      logoPhoto: initialData?.logoPhoto ?? '',
      ownerPhoto: initialData?.ownerPhoto ?? '',
      address: initialData?.address ?? '',
      city: initialData?.city ?? '',
      state: initialData?.state ?? '',
      zip: initialData?.zip ?? '',
      country: initialData?.country ?? '',
      phone: initialData?.phone ?? '',
      email: initialData?.email ?? '',
      website: initialData?.website ?? '',
    },
  })

  useEffect(() => {
    form.reset({
      shopName: initialData?.shopName ?? '',
      ownerName: initialData?.ownerName ?? '',
      bio: initialData?.bio ?? '',
      description: initialData?.description ?? '',
      logoPhoto: initialData?.logoPhoto ?? '',
      ownerPhoto: initialData?.ownerPhoto ?? '',
      address: initialData?.address ?? '',
      city: initialData?.city ?? '',
      state: initialData?.state ?? '',
      zip: initialData?.zip ?? '',
      country: initialData?.country ?? '',
      phone: initialData?.phone ?? '',
      email: initialData?.email ?? '',
      website: initialData?.website ?? '',
    })
  }, [initialData, form])

  const { mutate: updateShop } = api.shops.updateShop.useMutation({
    onSuccess: () => {
      toastService.success({ message: 'Shop updated.' })
      successCallback!()
    },
    onError: (error) =>
      toastService.error({ message: 'Something went wrong', error }),
    onMutate: () => setLoading(true),
    onSettled: () => {
      setLoading(false)
      void apiContext.shops.invalidate()
    },
  })

  const { mutate: createShop } = api.shops.createShop.useMutation({
    onSuccess: () => {
      toastService.success({ message: 'Shop created.' })
      successCallback!()
    },
    onError: (error) =>
      toastService.error({ message: 'Something went wrong', error }),
    onMutate: () => setLoading(true),
    onSettled: () => {
      setLoading(false)
      void apiContext.shops.invalidate()
    },
  })

  const onSubmit = (data: SettingsFormValues) => {
    if (!initialData) {
      createShop({
        ...data,
        ownerId: sessionData?.user?.id,
      })
    } else {
      updateShop({
        ...data,
        shopId: initialData?.id,
      })
    }
  }

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
          // className="w-full space-y-8"
        >
          <AdminFormHeader
            title={'Set up your shop'}
            description={
              "Let's set up your shop so you can start promoting. Info here is used to create your shop on the site. Any site visitor can see this information. You can always change it later."
            }
            contentName="Products"
            link={`/onboarding`}
          >
            <Button className="ml-auto" type="submit">
              Save and Continue
            </Button>
          </AdminFormHeader>
          <AdminFormBody className="mx-auto max-w-7xl flex-col space-y-0">
            <EditSection
              title="Shop Information"
              description="Provide basic info on your shop."
              bodyClassName="grid grid-cols-6 gap-4 gap-y-8"
            >
              <FormField
                control={form.control}
                name="shopName"
                render={({ field }) => (
                  <FormItem className="col-span-full md:col-span-3">
                    <FormLabel>Shop Name</FormLabel>
                    <FormControl>
                      <Input
                        disabled={loading}
                        placeholder="e.g. Handmade by Jane"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />{' '}
              <FormField
                control={form.control}
                name="ownerName"
                render={({ field }) => (
                  <FormItem className="col-span-full md:col-span-3">
                    <FormLabel>Owner&apos;s Name</FormLabel>
                    <FormControl>
                      <Input
                        disabled={loading}
                        placeholder="e.g. Jane Doe"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />{' '}
              <FormField
                control={form.control}
                name="logoPhoto"
                render={({ field }) => (
                  <FormItem className="col-span-full md:col-span-3">
                    <FormLabel>Logo</FormLabel>
                    <FormDescription>
                      The logo for (or image representing) your shop
                    </FormDescription>
                    <FormControl>
                      <LogoUpload
                        value={field.value ?? ''}
                        disabled={loading}
                        onChange={(url) => field.onChange(url)}
                        onRemove={() => field.onChange('')}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />{' '}
              <FormField
                control={form.control}
                name="ownerPhoto"
                render={({ field }) => (
                  <FormItem className="col-span-full md:col-span-3">
                    <FormLabel>Picture of Owner </FormLabel>
                    <FormDescription>
                      Store image defaults to this when set
                    </FormDescription>
                    <FormControl>
                      <LogoUpload
                        value={field.value ?? ''}
                        disabled={loading}
                        onChange={(url) => field.onChange(url)}
                        onRemove={() => field.onChange('')}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />{' '}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem className="col-span-full md:col-span-2">
                    <FormLabel>Phone (optional)</FormLabel>
                    <FormControl>
                      <Input
                        disabled={loading}
                        placeholder="e.g. 123-456-7890"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="col-span-full md:col-span-2">
                    <FormLabel>Email (optional)</FormLabel>
                    <FormControl>
                      <Input
                        disabled={loading}
                        placeholder="e.g. emaail@test.co"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem className="col-span-full md:col-span-2">
                    <FormLabel>Website (optional)</FormLabel>
                    <FormControl>
                      <Input
                        disabled={loading}
                        placeholder="e.g. https://test.co"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem className="col-span-full">
                    <FormLabel>Bio for the Shop Page (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        disabled={loading}
                        placeholder="e.g. Hey, my name is..."
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      For the shop page: Tell the world who you are!
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />{' '}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="col-span-full">
                    <FormLabel>Shop Description for the Shop Page</FormLabel>
                    <FormControl>
                      <Textarea
                        disabled={loading}
                        placeholder="e.g. Shop Inc. is a small business that aims to empower and inspire."
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      For the shop page: Tell the world what your business is
                      about! What do you sell? What is your mission? What other
                      details you want visitors to know?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </EditSection>
            <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6"></div>
            <EditSection
              title="Shop Address (optional)"
              description="Have a physical location? Share it here."
              bodyClassName="grid grid-cols-6 gap-4 gap-y-8"
            >
              {' '}
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="col-span-full">
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input
                        disabled={loading}
                        placeholder="e.g. 1235 State St."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />{' '}
              <FormField
                control={form.control}
                name="additional"
                render={({ field }) => (
                  <FormItem className="col-span-full">
                    <FormLabel>Additional</FormLabel>
                    <FormControl>
                      <Input
                        disabled={loading}
                        placeholder="e.g. Apt 4B"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2 sm:col-start-1">
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input
                        disabled={loading}
                        placeholder="e.g. Los Angeles"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input
                        disabled={loading}
                        placeholder="e.g. CA"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="zip"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Zip</FormLabel>
                    <FormControl>
                      <Input
                        disabled={loading}
                        placeholder="e.g. 90001"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />{' '}
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem className="hidden sm:col-span-3">
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input
                        disabled={loading}
                        placeholder="e.g. USA"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </EditSection>
          </AdminFormBody>
        </form>
      </Form>
    </>
  )
}
