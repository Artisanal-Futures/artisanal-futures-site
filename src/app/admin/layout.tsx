import { redirect } from "next/navigation";

import { env } from "~/env";
import { getSession } from "~/server/better-auth/server";
import { HydrateClient } from "~/trpc/server";

import SidebarWrapper from "./_components/sidebar-wrapper";

type Props = {
  children: React.ReactNode;
};

export default async function AdminPanelLayout(props: Props) {
  const session = await getSession();

  if (!session) {
    redirect(
      `/auth/sign-in?callbackUrl=${encodeURIComponent(
        `${env.NEXTAUTH_URL}/admin`,
      )}`,
    );
  }

  if (session?.user?.role !== "ADMIN") {
    redirect(`/unauthorized`);
  }

  return (
    <HydrateClient>
      <SidebarWrapper>{props.children}</SidebarWrapper>
    </HydrateClient>
  );
}
