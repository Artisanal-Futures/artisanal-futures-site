import { type ColumnDef } from '@tanstack/react-table'

import { RowLink } from '~/app/admin/_components/row-link'
import { type GuestSurveyColumn } from '../_validators/types'
import { ViewGuestSurveyDialog } from './view-prompt-dialog'

export const guestSurveyColumnStructure: ColumnDef<GuestSurveyColumn>[] = [
  {
    header: 'User',
    cell: ({ row }) => (
      <RowLink
        id={row.original.id.toString()}
        name={row.original.name ?? 'Guest'}
      />
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
