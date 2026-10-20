import { requireAdmin } from "../_lib/require-admin";

export default async function AdminCsvImportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return <>{children}</>;
}
