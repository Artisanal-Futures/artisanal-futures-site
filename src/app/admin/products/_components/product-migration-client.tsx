/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import type { ShopifyData, SquareSpaceData } from '../_validators/types'
import type { Product } from '~/types/product'
import { Button } from '~/components/ui/button'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '~/components/ui/pagination'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { Textarea } from '~/components/ui/textarea'
import { useDefaultMutationActions } from '~/hooks/use-default-mutation-actions'
import { api } from '~/trpc/react'
import { convertToProduct } from '../_utils/convert-to-product'

const ROWS_PER_PAGE = 10

const PRODUCT_SOURCES = {
  SHOPIFY: 'Shopify',
  SQUARESPACE: 'Squarespace',
} as const

type ProductSource = keyof typeof PRODUCT_SOURCES

export function DatabaseMigrationClient() {
  const [jsonInput, setJsonInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [parsedFields, setParsedFields] = useState<string[]>([])
  const [previewData, setPreviewData] = useState<Product[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedSource, setSelectedSource] = useState<ProductSource | null>(
    null,
  )
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null)
  const [selectedField, setSelectedField] = useState<string | null>(null)
  const [duplicates, setDuplicates] = useState<
    { field: string; values: string[]; count: number }[]
  >([])

  const totalPages = Math.ceil(previewData.length / ROWS_PER_PAGE)
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE
  const endIndex = startIndex + ROWS_PER_PAGE
  const currentData = previewData.slice(startIndex, endIndex)

  const { defaultActions } = useDefaultMutationActions({
    entity: 'product',
  })

  const productMigration =
    api.product.importProducts.useMutation(defaultActions)

  const { data: shops } = api.shops.getAllShops.useQuery()

  const checkDuplicates = (field: string) => {
    const valueMap = new Map<string, number>()
    const duplicateValues: string[] = []

    previewData.forEach((item) => {
      const value = (item as any)[field]?.toString() ?? ''
      valueMap.set(value, (valueMap.get(value) ?? 0) + 1)
    })

    valueMap.forEach((count, value) => {
      if (count > 1) {
        duplicateValues.push(value)
      }
    })

    if (duplicateValues.length > 0) {
      setDuplicates([
        {
          field,
          values: duplicateValues,
          count: duplicateValues.length,
        },
      ])
    } else {
      setDuplicates([])
    }
  }

  // Parse JSON to extract field names and convert to Product type
  const parseJSON = () => {
    try {
      if (!selectedSource) {
        throw new Error('Please select a product source')
      }

      if (!selectedShopId) {
        throw new Error('Please select a shop')
      }

      let convertedProducts: Partial<Product>[] = []

      // Parse JSON for sources
      const parsedJson = JSON.parse(jsonInput)

      if (selectedSource === 'SHOPIFY') {
        const shopifyData = parsedJson as ShopifyData
        convertedProducts = shopifyData.products.map(
          (product) =>
            convertToProduct(product, selectedShopId) as Partial<Product>,
        )
      } else if (selectedSource === 'SQUARESPACE') {
        const squarespaceData = parsedJson as SquareSpaceData
        convertedProducts = squarespaceData.items.map(
          (product) =>
            convertToProduct(product, selectedShopId) as Partial<Product>,
        )
      }

      if (!convertedProducts.length) {
        throw new Error('No products found in the data')
      }
      // Get fields from first product
      const firstProduct = convertedProducts[0]
      if (!firstProduct) {
        throw new Error('No products found in the data')
      }
      const fields = Object.keys(firstProduct)
      setParsedFields(fields)
      setPreviewData(convertedProducts as unknown as Product[])

      toast.success('Products parsed successfully')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to parse data',
      )
      console.error(error)
    }
  }

  const handleMigration = async () => {
    try {
      setLoading(true)
      productMigration.mutate(
        previewData as unknown as (Product & { shopProductId: string })[],
      )
      toast.success('Migration completed successfully')
    } catch (error) {
      toast.error('Failed to execute migration')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-12 mt-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Product Migration</h2>
        <div className="flex gap-4">
          <Select
            onValueChange={(value) => setSelectedSource(value as ProductSource)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Product Source" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PRODUCT_SOURCES).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select onValueChange={setSelectedShopId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Shop" />
            </SelectTrigger>
            <SelectContent>
              {shops?.map((shop) => (
                <SelectItem key={shop.id} value={shop.id}>
                  {shop.shopName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="relative space-y-2">
          <div className="rounded-md bg-muted p-4 text-sm">
            <h4 className="mb-2 font-medium">How to get your product data:</h4>
            {selectedSource === 'SHOPIFY' ? (
              <ol className="list-decimal space-y-1 pl-4">
                <li>Go to your Shopify admin panel</li>
                <li>Navigate to Products {'>'} All products</li>
                <li>
                  Add &quot;/products.json?limit=250&quot; to your shop URL
                </li>
                <li>Copy the entire JSON response and paste it below</li>
              </ol>
            ) : selectedSource === 'SQUARESPACE' ? (
              <ol className="list-decimal space-y-1 pl-4">
                <li>Go to your Squarespace site</li>
                <li>
                  Add &quot;?format=json-pretty&quot; to any collection page URL
                </li>
                <li>Copy the entire JSON response and paste it below</li>
              </ol>
            ) : (
              <p>Please select a product source to see instructions</p>
            )}
          </div>

          <Textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder="Paste product JSON..."
            className="min-h-[200px]"
          />
          <div className="absolute right-2 top-2">
            <Button onClick={parseJSON}>Parse JSON</Button>
          </div>
        </div>
      </div>

      {parsedFields.length > 0 && selectedSource && (
        <>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Check Duplicates</h3>
              <Select
                onValueChange={(value) => {
                  setSelectedField(value)
                  checkDuplicates(value)
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select field to check" />
                </SelectTrigger>
                <SelectContent>
                  {parsedFields.map((field) => (
                    <SelectItem key={field} value={field}>
                      {field}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {duplicates.length > 0 && (
              <div className="rounded-md border bg-yellow-50 p-4">
                <h4 className="font-medium">
                  Found {duplicates[0]?.count} duplicate values for field &quot;
                  {duplicates[0]?.field}&quot;:
                </h4>
                <ul className="mt-2 list-disc pl-5">
                  {duplicates[0]?.values?.map((value, index) => (
                    <li key={index}>{value}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Data Preview</h3>
              <p className="text-sm text-muted-foreground">
                Total rows: {previewData.length}
              </p>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Row</TableHead>
                    {parsedFields.map((field) => (
                      <TableHead key={field}>{field}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentData.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      <TableCell className="font-medium">
                        {startIndex + rowIndex + 1}
                      </TableCell>
                      {parsedFields.map((field) => (
                        <TableCell key={field}>{(row as any)[field]}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() =>
                        currentPage > 1 &&
                        setCurrentPage((p) => Math.max(1, p - 1))
                      }
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      // Show first page, last page, current page, and pages around current
                      return (
                        page === 1 ||
                        page === totalPages ||
                        Math.abs(currentPage - page) <= 1
                      )
                    })
                    .map((page, i, arr) => (
                      <PaginationItem key={page}>
                        {i > 0 && arr[i - 1] !== page - 1 ? (
                          <PaginationEllipsis />
                        ) : null}
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        currentPage < totalPages &&
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>

          <Button onClick={handleMigration} disabled={loading}>
            {loading ? 'Migrating...' : 'Run Migration'}
          </Button>
        </>
      )}
    </div>
  )
}
