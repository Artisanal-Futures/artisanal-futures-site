import { api } from "~/trpc/server";

import { OnboardingForm } from "./_components/onboarding-form";
import { OnboardingTabs } from "./_components/onboarding-tabs";

export const metadata = {
  title: "Welcome to Artisanal Futures",
  description: "Join our community of artisans",
};

export default async function OnboardingPage() {
  const { survey, shop } = await api.survey.getCurrent();

  return <OnboardingForm surveyInitialData={survey} shopInitialData={shop} />;
}
