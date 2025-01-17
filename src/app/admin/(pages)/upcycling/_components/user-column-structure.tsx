import { type ColumnDef } from '@tanstack/react-table'

import { AdvancedDataTableColumnHeader } from '~/components/tables/advanced-data-table-header'
import { cn } from '~/utils/styles'
import { type UpcyclingColumn } from '../_validators/types'
import { DeleteItemBtn } from './delete-item-btn'
import { ViewLikeDialog } from './view-like-dialog'
import { ViewPromptDialog } from './view-prompt-dialog'

export const attributeColumnStructure: ColumnDef<UpcyclingColumn>[] = [
  {
    id: 'user',
    accessorFn: (row) =>
      `${row.user?.name ?? 'Guest'} ${row.user?.email ?? 'No email'}`,
    header: 'User',
    cell: ({ row }) => (
      <div className="flex flex-col items-start space-y-1">
        <div className={cn('mx-0 px-0 text-sm font-medium text-gray-700')}>
          {row.original.user?.name ?? 'Guest'}
        </div>
        <div className="text-xs text-gray-500">
          {row.original.user?.email ?? 'No email'}
        </div>
        <div className="text-xs text-gray-400">
          ID: {row.original.user?.id ?? 'No ID'}
        </div>
      </div>
    ),
  },

  {
    accessorKey: 'generation_date',
    header: ({ column }) => (
      <AdvancedDataTableColumnHeader column={column} title="Created At" />
    ),
    cell: ({ row }) => (
      <div className="flex flex-col items-start">
        <div className={cn('mx-0 px-0 text-sm font-medium text-gray-700')}>
          {new Date(row.original.generation_date).toLocaleDateString()} at{' '}
          {new Date(row.original.generation_date).toLocaleTimeString()}
        </div>
        <div className="text-xs text-gray-500">
          Generation took {row.original.generation_time}s
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'prompt',
    header: 'Prompt',
    cell: ({ row }) => <>{row.original.prompt ?? ''}</>,
  },
  {
    accessorKey: 'like',
    header: 'Like',
    cell: ({ row }) => <ViewLikeDialog item={row.original} />,
  },

  {
    id: 'details',
    header: 'Details',
    cell: ({ row }) => <ViewPromptDialog item={row.original} />,
  },

  {
    id: 'delete',
    header: 'Delete',
    cell: ({ row }) => <DeleteItemBtn id={row.original.id} />,
  },
]
