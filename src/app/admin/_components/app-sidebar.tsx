/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  IconCalendar,
  IconCode,
  IconDashboard,
  IconDatabase,
  IconDeviceMobileMessage,
  IconFolder,
  IconGlobe,
  IconHeartHandshake,
  IconHelp,
  IconMail,
  IconMessageCircle,
  IconNotebook,
  IconPackage,
  IconSettings,
  IconShoppingCart,
  IconSparkles,
  IconUserPlus,
  IconUsers,
} from "@tabler/icons-react";

import type { Session } from "~/server/better-auth/config";
import { env } from "~/env";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/components/ui/sidebar";
import { NavMain } from "~/app/admin/_components/nav-main";
import { NavSecondary } from "~/app/admin/_components/nav-secondary";
import { NavUser } from "~/app/admin/_components/nav-user";

const getNavData = (session: Session | null) => {
  const navMain = [
    {
      title: "Dashboard",
      url: "/admin/dashboard",
      icon: IconDashboard,
    },

    {
      title: "Products",
      url: "/admin/products",
      icon: IconPackage,
    },
    {
      title: "Services",
      url: "/admin/services",
      icon: IconHeartHandshake,
    },
    {
      title: "Events",
      url: "/admin/events",
      icon: IconCalendar,
    },
    {
      title: "Website",
      url: "/admin/website",
      icon: IconGlobe,
    },
  ];

  const navPlatformAdmin:
    | {
        title: string;
        url: string;
        icon: React.ComponentType<any>;
      }[]
    | [] =
    session?.user.role === "ADMIN"
      ? [
          {
            title: "Shops",
            url: "/admin/shops",
            icon: IconShoppingCart,
          },
          {
            title: "Categories",
            url: "/admin/categories",
            icon: IconFolder,
          },
          {
            title: "Website Provisions",
            url: "/admin/website-provisions",
            icon: IconCode,
          },
          {
            title: "Surveys",
            url: "/admin/surveys",
            icon: IconNotebook,
          },
          {
            title: "Guest Surveys",
            url: "/admin/guest-surveys",
            icon: IconMessageCircle,
          },

          {
            title: "UPCY Admin",
            url: "https://generate.dev.artisanalfutures.org/admin",
            icon: IconSparkles,
          },

          {
            title: "Users",
            url: "/admin/users",
            icon: IconUsers,
          },
          {
            title: "Invites",
            url: "/admin/invites",
            icon: IconUserPlus,
          },
          {
            title: "Fork Import",
            url: "/admin/fork-import",
            icon: IconDatabase,
          },
        ]
      : [];

  return {
    navMain,
    navPlatformAdmin,
    navSecondary: [
      {
        title: "Get Help",
        url: env.NEXT_PUBLIC_HELP_DOCS_URL ?? "#!",
        icon: IconHelp,
      },
    ],
  };
};

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  session?: Session | null;
};

export function AppSidebar({
  session,

  ...props
}: AppSidebarProps) {
  const navData = getNavData(session ?? null);

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="h-20 w-full data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link href="/" className="relative aspect-video w-full">
                <Image
                  src={"/logos/logo.png"}
                  alt="Artisanal Futures logo"
                  fill
                  className="object-contain"
                />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navData.navMain} />
        {navData.navPlatformAdmin.length > 0 && (
          <NavMain items={navData.navPlatformAdmin} />
        )}
        <NavSecondary items={navData.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        {/* <WelcomeNotification /> */}
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
