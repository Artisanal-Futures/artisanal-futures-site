import { WizardClient } from "./_components/wizard-client";

type Props = {
  searchParams: Promise<{ code?: string }>;
};

export default async function ArtisanSignupPage({ searchParams }: Props) {
  const { code } = await searchParams;

  return <WizardClient initialCode={code} />;
}

export const metadata = {
  title: "Welcome Artisan!",
};
