import { requireAdmin } from "../_lib/require-admin";

export default async function AdminSurveysLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return <>{children}</>;
}
