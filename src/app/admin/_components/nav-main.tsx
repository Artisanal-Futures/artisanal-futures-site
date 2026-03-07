"use client";

import type { Icon } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/components/ui/sidebar";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: Icon | React.ComponentType<unknown>;
  }[];
}) {
  const pathname = usePathname();
  const isActive = (url: string) =>
    pathname === url || pathname.startsWith(url + "/");
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title} data-active={isActive(item.url)}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                className={
                  isActive(item.url)
                    ? "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary active:bg-primary/20 font-semibold"
                    : ""
                }
                aria-current={isActive(item.url) ? "page" : undefined}
              >
                <Link href={item.url} tabIndex={0}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
