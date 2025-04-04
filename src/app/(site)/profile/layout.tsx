import { redirect } from "next/navigation";
import { getServerAuthSession } from "~/server/auth";

import { env } from "~/env";
import { api } from "~/trpc/server";
import { Separator } from "~/components/ui/separator";
import { SidebarNav } from "~/app/(site)/profile/_components/sidebar-nav";

type Props = {
  children: React.ReactNode;
};

export default async function ProfileLayout({ children }: Props) {
  const session = await getServerAuthSession();

  if (!session) {
    redirect(
      `/auth/sign-in?callbackUrl=${encodeURIComponent(
        `${env.NEXTAUTH_URL}/profile`,
      )}`,
    );
  }

  // const shop = await api.shop.getCurrentUserShop();

  const data = await api.survey.getCurrent();

  const isArtisanSurveyCompleted = !!data?.survey && !!data?.shop;

  const isGuestSurveyCompleted = await api.guest.isCompleted();

  const surveyItems = [
    env.NEXT_PUBLIC_IS_GUEST_ONBOARDING && !isGuestSurveyCompleted
      ? {
          title: "Complete Onboarding",
          href: "/guest-welcome",
        }
      : undefined,

    !env.NEXT_PUBLIC_IS_GUEST_ONBOARDING && !isArtisanSurveyCompleted
      ? {
          title: "Complete Onboarding",
          href: "/artisan-welcome",
        }
      : undefined,
    !env.NEXT_PUBLIC_IS_GUEST_ONBOARDING && isArtisanSurveyCompleted
      ? {
          title: "My Shop",
          href: data?.shop
            ? `/profile/shop/${data?.shop?.id}`
            : "/profile/shop",
        }
      : undefined,

    !env.NEXT_PUBLIC_IS_GUEST_ONBOARDING && isArtisanSurveyCompleted
      ? {
          title: "My Survey",
          href: "/profile/survey",
        }
      : undefined,
  ];

  const navItems = [
    {
      title: "Profile",
      href: "/profile",
    },

    ...surveyItems,
  ] as { title: string; href: string }[];

  return (
    <>
      <div className="block space-y-6 py-5 pb-16">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
            <p className="text-muted-foreground">
              Manage your account settings , shop settings, and update
              preferences.
            </p>
          </div>
        </div>
        <Separator className="my-6" />
        <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
          <aside className="-mx-4 lg:w-1/5">
            <SidebarNav items={navItems} />
          </aside>
          <div className="flex-1 lg:max-w-2xl">{children}</div>
        </div>
      </div>
    </>
  );
}
