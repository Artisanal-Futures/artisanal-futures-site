import { api } from "~/trpc/server";

import { TrailHeader } from "../_components/trail-header";
import { UsersClient } from "./_components/users-client";

export default async function AdminUsersPage() {
  const users = await api.user.listUsers();

  return (
    <>
      <TrailHeader
        breadcrumbs={[{ label: `Platform Users (${users?.length ?? 0})` }]}
      />
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <h1>Platform Users</h1>
            <p>View and manage user roles and access on the platform</p>
          </div>
        </div>
        <UsersClient users={users ?? []} />
      </div>
    </>
  );
}

export const metadata = {
  title: "Platform Users",
};
