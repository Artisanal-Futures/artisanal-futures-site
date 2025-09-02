import { redirect } from "next/navigation";
import { getServerAuthSession } from "~/server/auth";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerAuthSession();

  if (!session) {
    return redirect("/auth/sign-in");
  }
  return <>{children}</>;
}
