import { type ColumnDef } from '@tanstack/react-table'

import { RowImageLink } from '~/components/admin/row-image-link'
import { type Product } from '~/types/product'
import { ItemDialog } from '../../_components/item-dialog'
import { DeleteProductDialog } from './delete-product-dialog'
import { ProjectForm } from './project-form'

export type ProductColumnEntry = Product & {
  searchableString: string
}

export const projectColumns: ColumnDef<ProductColumnEntry>[] = [
  {
    accessorKey: 'searchableString',
    header: 'Title',
    cell: ({ row }) => (
      <>
        <RowImageLink
          id={row.original.id}
          name={`${row.original.name} • #${row.original.id}`}
          image={row.original.imageUrl ?? ''}
          hasLink={false}
          subheader={`Created on ${row.original.createdAt.toLocaleDateString()}`}
        />
      </>
    ),
  },
  {
    accessorKey: 'shopId',
    header: 'Shop',
    accessorFn: (row) => row.shop?.id,
    filterFn: 'arrIncludesSome',
    cell: ({ row }) => (
      <div className="flex flex-col space-y-1">
        <span>{row.original.shop?.shopName}</span>
        <span className="text-xs text-muted-foreground">
          Shop ID: {row.original.shopId}
        </span>
      </div>
    ),
  },
  {
    accessorKey: 'scrapeMethod',
    header: 'Source',
    cell: ({ row }) => <span>{row.original.scrapeMethod}</span>,
  },
  {
    accessorKey: 'priceInCents',
    header: 'Price',
    cell: ({ row }) => (
      <span>
        {row.original.priceInCents
          ? `${row.original.currency ?? 'USD'} ${(row.original.priceInCents / 100).toFixed(2)}`
          : 'N/A'}
      </span>
    ),
  },
  {
    id: 'options',
    header: 'Options',
    cell: ({ row }) => (
      <div className="flex gap-2">
        <DeleteProductDialog productId={row.original.id} />
        <ItemDialog
          id={row.original.id}
          title={`Update ${row.original.name}`}
          subtitle="Make changes to the product"
          initialData={row.original}
          FormComponent={ProjectForm}
          mode="update"
        />
      </div>
    ),
  },
]
