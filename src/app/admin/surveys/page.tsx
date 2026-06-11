import { api } from "~/trpc/server";

import { TrailHeader } from "../_components/trail-header";
import { SurveyClient } from "./_components/survey-client";

export default async function SurveysAdminPage() {
  const surveys = await api.survey.getAll();

  return (
    <>
      <TrailHeader
        breadcrumbs={[{ label: `Surveys (${surveys?.length ?? 0})` }]}
      />
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <h1>All Artisan Surveys</h1>
            <p>Manage surveys for artisans of AF</p>
          </div>
        </div>
        <SurveyClient surveys={surveys} />
      </div>
    </>
  );
}

export const metadata = {
  title: "Surveys",
};
