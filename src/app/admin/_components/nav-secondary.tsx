"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { type Icon } from "@tabler/icons-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/components/ui/sidebar";

const isExternalUrl = (url: string) => /^https?:\/\//.test(url);

export function NavSecondary({
  items,
  ...props
}: {
  items: {
    title: string;
    url: string;
    icon: Icon;
  }[];
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const pathname = usePathname();
  const isActive = (url: string) =>
    pathname === url || pathname.startsWith(url + "/");

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <a
                  href={item.url}
                  target={isExternalUrl(item.url) ? "_blank" : undefined}
                  rel={
                    isExternalUrl(item.url) ? "noopener noreferrer" : undefined
                  }
                  className={
                    isActive(item.url)
                      ? "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary active:bg-primary/20 font-semibold"
                      : ""
                  }
                >
                  <item.icon />
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
