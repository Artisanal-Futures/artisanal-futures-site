import Link from "next/link";

import { getSession } from "~/server/better-auth/server";
import { api } from "~/trpc/server";

import { TrailHeader } from "../_components/trail-header";
import { UpcyclingClient } from "./_components/upcycling-client";

export const metadata = {
  title: "Upcycling Generations",
};

export default async function AdminUpcyclingPage() {
  const session = await getSession();
  const isAdmin = session?.user.role === "ADMIN";

  if (!isAdmin) {
    return (
      <div className="bg-background flex min-h-screen flex-col items-center justify-center">
        <div className="mx-auto max-w-md text-center">
          <h1 className="text-primary mb-4 text-4xl font-bold">
            Access Denied
          </h1>
          <p className="text-muted-foreground mb-8 text-lg">
            Sorry, you are not authorized to access this page. Please contact an
            administrator if you believe this is a mistake.
          </p>
          <Link
            href="/admin/dashboard"
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium"
          >
            Return to Admin Dashboard
          </Link>
        </div>
      </div>
    );
  }
  const upcycling = await api.upcycling.getAll();
  return (
    <>
      <TrailHeader
        breadcrumbs={[
          { label: `Upcycling Generations (${upcycling?.length ?? 0})` },
        ]}
      />
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <h1>All UPCY v1 Generations</h1>
            <p>
              Manage generations from the first version of UPCY. You can manage
              the latest version of UPCY generations in the{" "}
              <Link
                href="https://generate.dev.artisanalfutures.org/admin"
                className="text-primary hover:text-primary/80 font-semibold"
              >
                UPCY page
              </Link>
            </p>
          </div>
        </div>
        <UpcyclingClient upcycling={upcycling ?? []} />
      </div>
    </>
  );
}
