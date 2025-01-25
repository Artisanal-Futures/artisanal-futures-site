'use client'

import { toastService } from '@dreamwalker-studios/toasts'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { LoadButton } from '~/components/common/load-button'
import { ImageFormField } from '~/components/inputs/image-form-field'
import { InputFormField } from '~/components/inputs/input-form-field'
import { TextareaFormField } from '~/components/inputs/textarea-form-field'
import { Button } from '~/components/ui/button'
import { Form } from '~/components/ui/form'
import { ScrollArea } from '~/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { env } from '~/env'
import { useDefaultMutationActions } from '~/hooks/use-default-mutation-actions'
import { useFileUpload } from '~/lib/file-upload/hooks/use-file-upload'
import { api } from '~/trpc/react'
import { type Product } from '~/types/product'

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  image: z.any().nullable(),
  priceInCents: z.coerce.number().nullable(),
  currency: z.string().nullable(),
  productUrl: z.string().nullable(),
  attributeTags: z.array(z.string()),
  materialTags: z.array(z.string()),
  environmentalTags: z.array(z.string()),
  aiGeneratedTags: z.array(z.string()),
  imageUrl: z.string().nullable(),
  shopId: z.string().min(1, 'Shop is required'),
  shopProductId: z.string(),
  scrapeMethod: z
    .enum(['MANUAL', 'WORDPRESS', 'SHOPIFY', 'SQUARESPACE'])
    .default('MANUAL'),
})

type Props = {
  initialData: Product | null
  defaultEmail?: string
  onSuccessCallback?: () => void
}

type FormData = z.infer<typeof productSchema>

export function ProjectForm({
  initialData,
  defaultEmail,
  onSuccessCallback,
}: Props) {
  const { uploadFile, isUploading } = useFileUpload({
    route: 'products',
    api: '/api/upload-product',
    generateThumbnail: false,
  })

  const { defaultSuccess, defaultError, defaultSettled } =
    useDefaultMutationActions({
      entity: 'product',
    })

  const { data: shops } = api.shop.getAll.useQuery()

  const form = useForm<FormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialData?.name ?? '',
      description: initialData?.description ?? '',
      image: null,
      priceInCents: initialData?.priceInCents ?? 0,
      currency: initialData?.currency ?? 'USD',
      productUrl: initialData?.productUrl ?? '',
      attributeTags: initialData?.attributeTags ?? [],
      materialTags: initialData?.materialTags ?? [],
      environmentalTags: initialData?.environmentalTags ?? [],
      aiGeneratedTags: initialData?.aiGeneratedTags ?? [],
      shopId: initialData?.shopId ?? '',
      shopProductId: initialData?.shopProductId ?? '',
      scrapeMethod: initialData?.scrapeMethod ?? 'MANUAL',
      imageUrl: initialData?.imageUrl ?? '',
    },
  })

  const createProduct = api.product.create.useMutation({
    onSuccess: ({ message }: { message: string }) => {
      defaultSuccess({ message })
      onSuccessCallback?.()
    },
    onError: defaultError,
    onSettled: defaultSettled,
  })

  const updateProduct = api.product.update.useMutation({
    onSuccess: ({ message }: { message: string }) => {
      defaultSuccess({ message })
      onSuccessCallback?.()
    },
    onError: defaultError,
    onSettled: defaultSettled,
  })

  async function onSubmit(data: FormData) {
    let imageUrl: string | null = initialData?.imageUrl ?? null

    if (!data.image && !initialData?.imageUrl) {
      toastService.error('Please upload an image')
      return
    }

    if (data.image) {
      imageUrl = await uploadFile(data.image as File)

      if (!imageUrl) {
        toastService.error('Error uploading image')
        return
      }
    }

    if (!initialData && imageUrl) {
      createProduct.mutate({
        ...data,
        imageUrl,
      })
    } else {
      updateProduct.mutate({
        ...data,
        id: initialData!.id,
        imageUrl: imageUrl ?? undefined,
      })
    }
  }

  const isLoading = createProduct.isPending || isUploading

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
          className="h-full space-y-8"
        >
          <ScrollArea className="h-[50svh]" type="always">
            <div className="flex flex-col gap-4 p-1 md:grid md:grid-cols-6">
              <div className="col-span-2 flex flex-col gap-4">
                <InputFormField
                  form={form}
                  name="name"
                  label="Product name"
                  placeholder="e.g My product"
                  className="col-span-full"
                />

                <ImageFormField
                  form={form}
                  name="image"
                  label="Product image"
                  currentImageUrl={initialData?.imageUrl ?? ''}
                />

                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Shop</label>
                  <Select
                    onValueChange={(value) => form.setValue('shopId', value)}
                    defaultValue={initialData?.shopId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a shop" />
                    </SelectTrigger>
                    <SelectContent>
                      {shops?.map((shop) => (
                        <SelectItem key={shop.id} value={shop.id}>
                          {shop.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="col-span-4 flex flex-col gap-4">
                <InputFormField
                  form={form}
                  name="productUrl"
                  label="Product URL"
                  className="col-span-full"
                />

                <div className="grid grid-cols-2 gap-4">
                  <InputFormField
                    form={form}
                    name="priceInCents"
                    label="Price (in cents)"
                    type="number"
                  />
                  <InputFormField
                    form={form}
                    name="currency"
                    label="Currency"
                  />
                </div>

                <TextareaFormField
                  form={form}
                  name="description"
                  label="Description"
                  className="col-span-full"
                />
              </div>
            </div>
          </ScrollArea>

          <div className="flex h-auto justify-end">
            <Button variant="outline" onClick={onSuccessCallback} type="button">
              Cancel
            </Button>
            <LoadButton
              isLoading={isLoading}
              loadingText="Creating product..."
              type="submit"
            >
              {initialData ? 'Update product' : 'Create product'}
            </LoadButton>
          </div>
        </form>
      </Form>
    </>
  )
}
