"use client";

import { useMemo } from "react";

import type { RouterOutputs } from "~/trpc/react";
import { AdvancedDataTable } from "~/components/tables/advanced-data-table";

import { userColumns } from "./user-column-structure";
import { createUserFilters } from "./user-filters";

type UsersClientProps = {
  users: RouterOutputs["user"]["listUsers"];
};

export function UsersClient({ users }: UsersClientProps) {
  const userFilters = useMemo(() => createUserFilters(users ?? []), [users]);

  return (
    <div className="py-4">
      <AdvancedDataTable
        searchKey="user"
        searchPlaceholder="Search by name or email..."
        columns={userColumns}
        mobileHiddenColumnIds={["owns", "verified", "authMethod"]}
        data={users}
        filters={userFilters}
      />
    </div>
  );
}
