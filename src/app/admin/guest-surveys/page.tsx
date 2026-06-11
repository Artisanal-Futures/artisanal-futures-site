import { getSession } from "~/server/better-auth/server";
import { api } from "~/trpc/server";

import { TrailHeader } from "../_components/trail-header";
import { GuestSurveysClient } from "./_components/guest-surveys-client";

export default async function AdminGuestSurveysPage() {
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
        </div>
      </div>
    );
  }
  const guests = await api.onboarding.getGuestSurveys();
  return (
    <>
      <TrailHeader
        breadcrumbs={[{ label: `Guest Surveys (${guests?.length ?? 0})` }]}
      />
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <h1>All Guest Surveys</h1>
            <p>Manage surveys for guests of AF</p>
          </div>
        </div>
        <GuestSurveysClient guests={guests ?? []} />
      </div>
    </>
  );
}

export const metadata = {
  title: "Guest Surveys",
};
