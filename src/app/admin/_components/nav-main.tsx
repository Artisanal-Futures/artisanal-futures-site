"use client";

import type { Icon } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuBadge,
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
    /** Count shown alongside the item; hidden when zero or undefined. */
    badge?: number;
  }[];
}) {
  const pathname = usePathname();
  const matches = (url: string) =>
    pathname === url || pathname.startsWith(url + "/");

  // Only the *most specific* matching entry lights up. Nested routes otherwise
  // activate their parent too — /admin/products/sync matches both "Products"
  // and "Product Sync" — which reads as two places at once.
  const activeUrl = items
    .map((item) => item.url)
    .filter(matches)
    .sort((a, b) => b.length - a.length)[0];

  const isActive = (url: string) => url === activeUrl;
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
              {!!item.badge && item.badge > 0 && (
                <SidebarMenuBadge
                  className="bg-primary text-primary-foreground rounded-full px-1.5"
                  aria-label={`${item.badge} awaiting review`}
                >
                  {item.badge}
                </SidebarMenuBadge>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
