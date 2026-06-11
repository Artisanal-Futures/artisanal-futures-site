"use client";

import type { InviteRow } from "./invite-column-structure";

export const createInviteFilters = (invites: InviteRow[]) => {
  // Collect distinct roles from actual data
  const roleSet = new Set<string>();
  for (const invite of invites) {
    roleSet.add(invite.role);
  }
  const roleOptions = Array.from(roleSet)
    .sort()
    .map((role) => ({ value: role, label: role.charAt(0) + role.slice(1).toLowerCase() }));

  return [
    {
      column: "role",
      title: "Role",
      filters: roleOptions,
    },
    {
      column: "status",
      title: "Status",
      filters: [
        { value: "pending", label: "Pending" },
        { value: "used", label: "Used" },
        { value: "expired", label: "Expired" },
      ],
    },
  ];
};
