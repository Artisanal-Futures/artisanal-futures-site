'use client'

import type { User } from '@prisma/client'

import {
  AdvancedDataTable,
  FilterOption,
} from '~/components/tables/advanced-data-table'
import { usePermissions } from '~/hooks/use-permissions'
import { api } from '~/trpc/react'
import { type Shop } from '~/types/shop'
import { ItemDialog } from '../../_components/item-dialog'
import { shopColumns } from './shop-column-structure'
import { createShopFilters } from './shop-filters'
import { ShopForm } from './shop-form'
import { ShopHelpDialog } from './shop-help-dialog'

type Props = { shops: (Shop & { owner: User })[] }

export function ShopClient({ shops }: Props) {
  const { isElevated } = usePermissions()

  const shopFilter = createShopFilters(shops, isElevated)

  return (
    <div className="py-4">
      <AdvancedDataTable
        searchKey="shopName"
        searchPlaceholder="Filter by shop name..."
        columns={shopColumns}
        data={shops ?? []}
        filters={shopFilter as FilterOption[]}
        defaultColumnVisibility={{
          owner: isElevated,
        }}
        addButton={
          <ItemDialog
            title={`Create shop`}
            subtitle="Create a new shop"
            FormComponent={ShopForm}
            type="shop"
            mode="create"
            contentClassName="max-w-5xl w-full"
          />
        }
      />
    </div>
  )
}
