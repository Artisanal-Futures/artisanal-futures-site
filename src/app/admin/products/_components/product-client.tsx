'use client'

import Link from 'next/link'
import { AlertCircleIcon } from 'lucide-react'

import { AdvancedDataTable } from '~/components/tables/advanced-data-table'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { buttonVariants } from '~/components/ui/button'
import { env } from '~/env'
import { usePermissions } from '~/hooks/use-permissions'
import { cn } from '~/lib/utils'
import { type Product } from '~/types/product'
import { ItemDialog } from '../../_components/item-dialog'
import { projectColumns } from './project-column-structure'
import { createProjectFilter } from './project-filters'
import { ProjectForm } from './project-form'

type Props = { products: Product[] }

export function ProductClient({ products }: Props) {
  const { isElevated, userRole } = usePermissions()

  const productFilters = createProjectFilter(products ?? [], isElevated)

  const enhancedProducts = products.map((product) => ({
    ...product,
    searchableString:
      `${product.name} ${product.description} ${product.id}`.toLowerCase(),
  }))

  return (
    <div className="py-4">
      <AdvancedDataTable
        searchKey="searchableString"
        searchPlaceholder="Search by title, description, or ID..."
        columns={projectColumns}
        data={enhancedProducts ?? []}
        filters={productFilters}
        defaultColumnVisibility={{
          user_id: isElevated,
        }}
        addButton={
          <>
            <ItemDialog
              title={`Create project`}
              subtitle="Create a new project"
              FormComponent={ProjectForm}
              type="project"
              mode="create"
            />
          </>
        }
      />
    </div>
  )
}
