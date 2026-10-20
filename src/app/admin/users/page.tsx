import { api } from "~/trpc/server";

import { TrailHeader } from "../_components/trail-header";
import { UsersClient } from "./_components/users-client";

export default async function AdminUsersPage() {
  const users = await api.user.listUsers();
  const count = users?.length ?? 0;

  return (
    <>
      <TrailHeader breadcrumbs={[{ label: "Users" }]} />
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <h1>Platform Users</h1>
            <p>
              {count} {count === 1 ? "user" : "users"}. View and manage user
              roles and access on the platform
            </p>
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
