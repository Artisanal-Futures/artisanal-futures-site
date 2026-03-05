import { GuestWizardClient } from "./_components/guest-wizard-client";

type Props = {
  searchParams: Promise<{ code?: string }>;
};

export default async function GuestJoinPage({ searchParams }: Props) {
  const { code } = await searchParams;

  return <GuestWizardClient initialCode={code} />;
}

export const metadata = {
  title: "Join as Guest",
};
