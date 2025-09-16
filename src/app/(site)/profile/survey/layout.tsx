import { redirect } from "next/navigation";
import { getServerAuthSession } from "~/server/auth";

import { api } from "~/trpc/server";

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerAuthSession();

  if (!session) redirect("/unauthorized");

  const { survey, shop } = await api.survey.getCurrent();

  if (!survey || !shop) redirect("/artisan-welcome");

  // const authorizedRoles: Role[] = ['ADMIN', 'ARTISAN']

  // if (!authorizedRoles.includes(session?.user?.role)) redirect('/unauthorized')

  return <>{children}</>;
}
