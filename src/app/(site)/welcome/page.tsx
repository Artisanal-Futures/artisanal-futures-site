import { redirect } from "next/navigation";

import { env } from "~/env";
import { getSession } from "~/server/better-auth/server";

import { WelcomeCard } from "./_components/welcome-card";

export default async function WelcomePage() {
  const session = await getSession();

  if (!session) {
    redirect("/auth/sign-in?callbackUrl=/welcome");
  }

  const isDev = env.NODE_ENV === "development";
  if (!isDev && session.user.role !== "GUEST") {
    redirect("/");
  }

  return (
    <WelcomeCard
      user={{
        name: session.user.name ?? null,
        email: session.user.email ?? null,
        avatar: session.user.image ?? null,
      }}
    />
  );
}

export const metadata = {
  title: "Welcome to Artisanal Futures",
};
