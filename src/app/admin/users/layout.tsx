import { redirect } from "next/navigation";

import { getSession } from "~/server/better-auth/server";

export default async function AdminUsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (session?.user?.role !== "ADMIN") {
    redirect("/unauthorized");
  }
  return <>{children}</>;
}
