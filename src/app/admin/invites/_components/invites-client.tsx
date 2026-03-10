"use client";

import type { RouterOutputs } from "~/trpc/react";

import { AdvancedDataTable } from "~/components/tables/advanced-data-table";

import { inviteColumns } from "./invite-column-structure";
import { SendInviteDialog } from "./send-invite-dialog";

type InvitesClientProps = {
  invites: RouterOutputs["invite"]["listInvites"];
};

export function InvitesClient({ invites }: InvitesClientProps) {
  return (
    <div className="py-4">
      <AdvancedDataTable
        searchKey="email"
        searchPlaceholder="Search by email..."
        columns={inviteColumns}
        data={invites}
        addButton={<SendInviteDialog />}
      />
    </div>
  );
}
