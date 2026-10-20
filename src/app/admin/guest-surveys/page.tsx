import { api } from "~/trpc/server";

import { TrailHeader } from "../_components/trail-header";
import { GuestSurveysClient } from "./_components/guest-surveys-client";

export default async function AdminGuestSurveysPage() {
  const guests = await api.onboarding.getGuestSurveys();
  const count = guests?.length ?? 0;
  return (
    <>
      <TrailHeader breadcrumbs={[{ label: "Guest Surveys" }]} />
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <h1>All Guest Surveys</h1>
            <p>
              {count} {count === 1 ? "response" : "responses"}. Manage surveys
              for guests of AF
            </p>
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
