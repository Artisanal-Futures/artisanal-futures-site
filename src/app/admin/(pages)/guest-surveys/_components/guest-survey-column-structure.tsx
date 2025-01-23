import { type ColumnDef } from '@tanstack/react-table'

import { AdvancedDataTableColumnHeader } from '~/components/tables/advanced-data-table-header'
import { cn } from '~/utils/styles'
import { type GuestSurveyColumn } from '../_validators/types'
import { ViewGuestSurveyDialog } from './view-prompt-dialog'

export const guestSurveyColumnStructure: ColumnDef<GuestSurveyColumn>[] = [
  {
    id: 'user',
    header: 'User',
    accessorFn: (row) => `${row?.name ?? 'Guest'} ${row?.email ?? 'No email'}`,
    cell: ({ row }) => (
      <div className="flex flex-col items-start space-y-1">
        <div className={cn('mx-0 px-0 text-sm font-medium text-gray-700')}>
          {row.original?.name ?? row.original.user?.name ?? 'Guest'}
        </div>
        <div className="text-xs text-gray-500">
          {row.original?.email ?? row.original.user?.email ?? 'No email'}
        </div>
        <div className="text-xs text-gray-400">
          User ID: {row.original?.user?.id ?? 'No ID'}
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <AdvancedDataTableColumnHeader column={column} title="Created At" />
    ),
    cell: ({ row }) => (
      <div className="flex flex-col items-start">
        <div className={cn('mx-0 px-0 text-sm font-medium text-gray-700')}>
          {new Date(row.original.createdAt).toLocaleDateString()} at{' '}
          {new Date(row.original.createdAt).toLocaleTimeString()}
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'prompt',
    header: 'Email',
    cell: ({ row }) => <>{row.original.email ?? ''}</>,
  },

  {
    id: 'actions',
    cell: ({ row }) => <ViewGuestSurveyDialog item={row.original} />,
  },
]
