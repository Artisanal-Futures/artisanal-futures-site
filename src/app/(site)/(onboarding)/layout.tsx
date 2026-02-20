import { redirect } from "next/navigation";

import { getSession } from "~/server/better-auth/server";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    return redirect("/auth/sign-in");
  }
  return <>{children}</>;
}
