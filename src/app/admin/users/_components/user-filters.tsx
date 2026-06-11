"use client";

import type { UserRow } from "./user-column-structure";

export const createUserFilters = (users: UserRow[]) => {
  const roleSet = new Set<string>();
  for (const user of users) {
    roleSet.add(user.role);
  }
  const roleOptions = Array.from(roleSet)
    .sort()
    .map((role) => ({
      value: role,
      label: role.charAt(0) + role.slice(1).toLowerCase(),
    }));

  return [
    {
      column: "role",
      title: "Role",
      filters: roleOptions,
    },
    {
      column: "authMethod",
      title: "Auth method",
      filters: [
        { value: "credential", label: "Credential" },
        { value: "social", label: "Social" },
      ],
    },
    {
      column: "verified",
      title: "Verified",
      filters: [
        { value: "yes", label: "Verified" },
        { value: "no", label: "Not verified" },
      ],
    },
  ];
};
