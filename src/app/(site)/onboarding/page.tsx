import { api } from '~/trpc/server'
import { OnboardingTabs } from './_components/onboarding-tabs'

export const metadata = {
  title: 'Onboarding',
  description: 'Set up your shop and survey',
}

export default async function OnboardingPage() {
  const shop = await api.shops.getCurrentUserShop()
  const survey = await api.surveys.getCurrentUserSurvey()
  return (
    <>
      <OnboardingTabs shop={shop} survey={survey} />
    </>
  )
}
