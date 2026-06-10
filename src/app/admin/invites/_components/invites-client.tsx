"use client";

import { useMemo, useState } from "react";

import { type RowSelectionState } from "@tanstack/react-table";

import type { RouterOutputs } from "~/trpc/react";
import { AdvancedDataTable } from "~/components/tables/advanced-data-table";

import { InviteBulkActions } from "./invite-bulk-actions";
import { inviteColumns } from "./invite-column-structure";
import { createInviteFilters } from "./invite-filters";
import { SendInviteDialog } from "./send-invite-dialog";

type InvitesClientProps = {
  invites: RouterOutputs["invite"]["listInvites"];
};

export function InvitesClient({ invites }: InvitesClientProps) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const selectedInviteIds = useMemo(() => {
    return Object.keys(rowSelection)
      .filter((key) => rowSelection[key])
      .map((index) => invites[parseInt(index, 10)]?.id)
      .filter((id): id is string => !!id);
  }, [rowSelection, invites]);

  const inviteFilters = useMemo(
    () => createInviteFilters(invites ?? []),
    [invites],
  );

  return (
    <div className="py-4">
      <AdvancedDataTable
        searchKey="email"
        searchPlaceholder="Search by email..."
        columns={inviteColumns}
        mobileHiddenColumnIds={["code", "expiresAt", "createdAt", "creator"]}
        data={invites}
        filters={inviteFilters}
        addButton={<SendInviteDialog />}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        selectionActions={
          <InviteBulkActions
            selectedInviteIds={selectedInviteIds}
            onClear={() => setRowSelection({})}
          />
        }
      />
    </div>
  );
}
