import { redirect } from "next/navigation";

import { api } from "~/trpc/server";
import { SurveyForm } from "~/app/(site)/profile/survey/_components/survey-form";

export const metadata = {
  title: "Survey Dashboard",
};

export default async function ProfileSurveyPage() {
  const shop = await api.shop.getCurrentUserShop();

  if (!shop) {
    return redirect("/profile/shop");
  }

  const survey = await api.survey.getCurrentUserShopSurvey({
    shopId: shop?.id ?? "",
  });

  return (
    <div className="space-y-6">
      <SurveyForm initialData={survey ?? null} shop={shop} />
    </div>
  );
}
