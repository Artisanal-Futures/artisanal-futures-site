import { getSession } from "~/server/better-auth/server";

import { TrailHeader } from "../_components/trail-header";

export const metadata = {
  title: "Admin Dashboard",
};

export default async function AdminPage() {
  const session = await getSession();
  return (
    <>
      <TrailHeader breadcrumbs={[]} />
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <h1>Admin Dashboard</h1>
            <p>Welcome back {session?.user?.name}</p>
          </div>
        </div>
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground text-lg">
            🚧 Dashboard is under construction 🚧
          </p>
        </div>
      </div>
    </>
  );
}
