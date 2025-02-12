import { redirect } from "next/navigation";
import { getServerAuthSession } from "~/server/auth";

import GuestArtisanRegistrationForm from "./_components/guest-form";

export default async function WelcomePage() {
  const sessionData = await getServerAuthSession();

  if (!sessionData) redirect(`/auth/sign-in?callbackUrl=/welcome`);
  // if (
  //   sessionData?.user?.role !== 'GUEST' &&
  //   sessionData?.user?.role !== 'ADMIN'
  // ) {
  //   redirect('/')
  // }

  return <GuestArtisanRegistrationForm />;
}
