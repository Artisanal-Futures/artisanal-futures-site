'use client'

import { AdvancedDataTable } from '~/components/tables/advanced-data-table'
import { UpcyclingItem } from '~/types'
import { UpcyclingColumn } from '../_validators/types'
import { ExportAsCSV } from './export-as-csv'
import { attributeColumnStructure } from './user-column-structure'

type Props = { upcycling: UpcyclingItem[] }

export function UpcyclingClient({ upcycling }: Props) {
  return (
    <div className="py-4">
      <AdvancedDataTable
        searchKey="name"
        columns={attributeColumnStructure}
        data={upcycling as UpcyclingColumn[]}
        addButton={<ExportAsCSV upcycling={upcycling} />}
      />
    </div>
  )
}
