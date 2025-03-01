import { api } from "~/trpc/server";

import { AdminClientLayout } from "../_components/client-layout";
import { SurveyClient } from "./_components/survey-client";

export const metadata = {
  title: "Surveys",
};

export default async function SurveysAdminPage() {
  const surveys = await api.survey.getAll();

  return (
    <AdminClientLayout currentPage="Surveys" title="Surveys">
      <SurveyClient surveys={surveys} />
    </AdminClientLayout>
  );
}
