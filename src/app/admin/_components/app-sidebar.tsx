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
  IconHeartHandshake,
  IconHelp,
  IconMail,
  IconMessageCircle,
  IconNotebook,
  IconPackage,
  IconSettings,
  IconShoppingCart,
  IconUserPlus,
} from "@tabler/icons-react";

import type { Session } from "~/server/better-auth/config";
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
      title: "Shops",
      url: "/admin/shops",
      icon: IconShoppingCart,
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
      title: "Categories",
      url: "/admin/categories",
      icon: IconFolder,
    },
    {
      title: "Events",
      url: "/admin/events",
      icon: IconCalendar,
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
            title: "Website Provisions",
            url: "/admin/websites",
            icon: IconCode,
          },
          {
            title: "Surveys",
            url: "/admin/surveys",
            icon: IconNotebook,
          },
          {
            title: "Fork Import",
            url: "/admin/fork-import",
            icon: IconDatabase,
          },
          {
            title: "Upcycling",
            url: "/admin/upcycling",
            icon: IconDeviceMobileMessage,
          },
          {
            title: "Guest Surveys",
            url: "/admin/guest-surveys",
            icon: IconMessageCircle,
          },
          {
            title: "Invites",
            url: "/admin/invites",
            icon: IconUserPlus,
          },
        ]
      : [];

  return {
    navMain,
    navPlatformAdmin,
    navSecondary: [
      {
        title: "Settings",
        url: "/admin/settings",
        icon: IconSettings,
      },
      {
        title: "Emails",
        url: "/admin/emails",
        icon: IconMail,
      },
      {
        title: "Get Help",
        url: "#!",
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
