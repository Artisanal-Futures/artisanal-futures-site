import { getServerAuthSession } from "~/server/auth";

import { api } from "~/trpc/server";

import { AdminClientLayout } from "../_components/client-layout";
import { GuestSurveysClient } from "./_components/guest-surveys-client";

export const metadata = {
  title: "Guest Surveys",
};

export default async function AdminGuestSurveysPage() {
  const guests = await api.guest.getAll();

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
        </div>
      </div>
    );
  }

  return (
    <AdminClientLayout
      title={`Guest Surveys (${guests?.length ?? 0})`}
      currentPage="Guest Surveys"
    >
      <GuestSurveysClient guests={guests ?? []} />
    </AdminClientLayout>
  );
}
