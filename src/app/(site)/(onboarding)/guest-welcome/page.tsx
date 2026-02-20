import { redirect } from "next/navigation";

import { getSession } from "~/server/better-auth/server";

import GuestArtisanRegistrationForm from "./_components/guest-form";

export default async function WelcomePage() {
  const sessionData = await getSession();

  if (!sessionData) redirect(`/auth/sign-in?callbackUrl=/guest-welcome`);
  // if (
  //   sessionData?.user?.role !== 'GUEST' &&
  //   sessionData?.user?.role !== 'ADMIN'
  // ) {
  //   redirect('/')
  // }

  return <GuestArtisanRegistrationForm />;
}
