import { requireAdmin } from "../_lib/require-admin";

export default async function AdminSectorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return <>{children}</>;
}
