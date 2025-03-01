import { api } from "~/trpc/server";

import { OnboardingForm } from "./_components/onboarding-form";

export const metadata = {
  title: "Welcome to Artisanal Futures",
};

export default async function OnboardingPage() {
  const { survey, shop } = await api.survey.getCurrent();

  return <OnboardingForm surveyInitialData={survey} shopInitialData={shop} />;
}
