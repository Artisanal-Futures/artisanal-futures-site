import { redirect } from 'next/navigation'

import { SurveyForm } from '~/app/(site)/profile/_components/survey-form'
import { api } from '~/trpc/server'

export default async function ProfileSurveyPage() {
  const shop = await api.shops.getCurrentUserShop()

  if (!shop) {
    return redirect('/profile/shop')
  }

  const survey = await api.surveys.getCurrentUserShopSurvey({
    shopId: shop?.id ?? '',
  })

  return (
    <div className="space-y-6">
      <SurveyForm initialData={survey ?? null} shop={shop} />
    </div>
  )
}
