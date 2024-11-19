import { type ColumnDef } from '@tanstack/react-table'

// import { format } from 'date-fns'

// import { CellActions } from '~/app/admin/_components/cell-actions'
import { RowLink } from '~/app/admin/_components/row-link'
import { type UpcyclingColumn } from '../_validators/types'
import { DeleteItemBtn } from './delete-item-btn'
import { ViewLikeDialog } from './view-like-dialog'
import { ViewPromptDialog } from './view-prompt-dialog'

export const attributeColumnStructure: ColumnDef<UpcyclingColumn>[] = [
  {
    header: 'User',
    cell: ({ row }) => (
      <RowLink
        id={row.original.user?.id ?? ''}
        name={row.original.user?.email ?? 'Guest'}
      />
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
