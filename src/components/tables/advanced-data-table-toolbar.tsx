'use client'

import type { Table } from '@tanstack/react-table'
import { Fragment } from 'react'
import { PlusCircleIcon, XCircleIcon } from 'lucide-react'

import type { FilterOption } from './advanced-data-table'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { DataTableFacetedFilter } from './advanced-data-table-faceted-filter'
import { DataTableViewOptions } from './advanced-data-table-view-options'

type Props<TData> = {
  table: Table<TData>
  filters?: FilterOption[]
  searchKey: string
  handleAdd?: () => void
  addButtonLabel?: string
  addButton?: React.ReactNode
  moreOptions?: React.ReactNode
}

export function DataTableToolbar<TData>({
  table,
  filters,
  searchKey,
  handleAdd,
  addButtonLabel = 'Add',
  addButton,
  moreOptions,
}: Props<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0

  return (
    <>
      <div className="flex items-center justify-between">
        <Input
          placeholder={`Filter by ${searchKey}...`}
          value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn(searchKey)?.setFilterValue(event.target.value)
          }
          className="flex h-8 w-full lg:w-3/4"
        />

        <div className="flex gap-2">
          {handleAdd && (
            <Button
              variant="default"
              size="sm"
              className="ml-auto hidden h-8 lg:flex"
              onClick={handleAdd}
            >
              <PlusCircleIcon className="mr-2 h-4 w-4" />
              {addButtonLabel}
            </Button>
          )}

          {!!addButton && addButton}

          {!!moreOptions && moreOptions}

          <DataTableViewOptions table={table} />
        </div>
      </div>
      <div className="flex items-center justify-between pt-4">
        <div className="flex flex-1 items-center space-x-2">
          {filters?.map((filter, idx) => (
            <Fragment key={idx}>
              {table.getColumn(filter?.column) && (
                <DataTableFacetedFilter
                  column={table.getColumn(filter?.column)}
                  title={filter.title}
                  options={filter.filters}
                />
              )}
            </Fragment>
          ))}

          {isFiltered && (
            <Button
              variant="ghost"
              onClick={() => table.resetColumnFilters()}
              className="h-8 px-2 lg:px-3"
            >
              Reset
              <XCircleIcon className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
        {/* <DataTableViewOptions table={table} /> */}
      </div>
    </>
  )
}
