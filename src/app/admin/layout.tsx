import { redirect } from "next/navigation";

import { env } from "~/env";
import { getSession } from "~/server/better-auth/server";
import { HydrateClient } from "~/trpc/server";
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";

import { AppSidebar } from "./_components/app-sidebar";

type Props = {
  children: React.ReactNode;
};

export default async function AdminPanelLayout(props: Props) {
  const session = await getSession();

  if (!session) {
    redirect(
      `/auth/sign-in?callbackUrl=${encodeURIComponent(
        `${env.BETTER_AUTH_URL}/admin`,
      )}`,
    );
  }

  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "ARTISAN") {
    redirect(`/unauthorized`);
  }

  return (
    <HydrateClient>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" session={session} />
        <SidebarInset className="min-w-0 overflow-x-hidden">
          <div className="min-h-screen bg-gray-50">{props.children}</div>
        </SidebarInset>
      </SidebarProvider>
    </HydrateClient>
  );
}
