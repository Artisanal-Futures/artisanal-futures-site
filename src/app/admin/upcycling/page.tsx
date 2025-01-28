import { getServerAuthSession } from "~/server/auth";

import { api } from "~/trpc/server";

import { AdminClientLayout } from "../_components/client-layout";
import { UpcyclingClient } from "./_components/upcycling-client";

export const metadata = {
  title: "Upcycling Generations",
};

export default async function AdminUpcyclingPage() {
  const upcycling = await api.upcycling.getAll();

  const session = await getServerAuthSession();
  const isAdmin = session?.user.role === "ADMIN";

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <div className="mx-auto max-w-md text-center">
          <h1 className="mb-4 text-4xl font-bold text-primary">
            Access Denied
          </h1>
          <p className="mb-8 text-lg text-muted-foreground">
            Sorry, you are not authorized to access this page. Please contact an
            administrator if you believe this is a mistake.
          </p>
          <a
            href="/admin/dashboard"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Return to Admin Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <AdminClientLayout
      title={`Upcycling Generations (${upcycling?.length ?? 0})`}
      currentPage="Upcycling"
    >
      <UpcyclingClient upcycling={upcycling ?? []} />
    </AdminClientLayout>
  );
}
