import type { LucideIcon } from "lucide-react";
import {
  BoxesIcon,
  ImageIcon,
  LayoutGrid,
  NotebookTextIcon,
  SquarePen,
  StoreIcon,
} from "lucide-react";

import { Role } from "@prisma/client";

type Submenu = {
  href: string;
  label: string;
  active: boolean;
  restrictedAccess: Role[];
};

type Menu = {
  href: string;
  label: string;
  active: boolean;
  icon: LucideIcon;
  restrictedAccess: Role[];
  submenus: Submenu[];
};

type Group = {
  groupLabel: string;
  menus: Menu[];
};

export function getMenuList(pathname: string): Group[] {
  return [
    {
      groupLabel: "",
      menus: [
        {
          href: `/admin/dashboard`,
          label: "Dashboard",
          active: pathname.includes(`/admin/dashboard`),
          icon: LayoutGrid,
          submenus: [],
          restrictedAccess: [],
        },
      ],
    },
    {
      groupLabel: "Shops",
      menus: [
        {
          href: `/admin/shops`,
          label: "Shops",
          active: pathname.includes(`/admin/shops`),
          icon: StoreIcon,
          submenus: [],
          restrictedAccess: [],
        },
        {
          href: `/admin/products`,
          label: "Products",
          active: pathname.includes(`/admin/products`),
          icon: BoxesIcon,
          submenus: [],
          restrictedAccess: [],
        },
        {
          href: `/admin/surveys`,
          label: "Surveys",
          active: pathname.includes(`/admin/surveys`),
          icon: NotebookTextIcon,
          submenus: [],
          restrictedAccess: [],
        },
      ],
    },

    {
      groupLabel: "Tools",
      menus: [
        {
          href: `/admin/upcycling`,
          label: "Upcycling",
          active: pathname.includes(`/admin/upcycling`),
          icon: ImageIcon,
          submenus: [],
          restrictedAccess: [],
        },
        {
          href: `/admin/guest-surveys`,
          label: "Guest Surveys",
          active: pathname.includes(`/admin/guest-surveys`),
          icon: SquarePen,
          submenus: [],
          restrictedAccess: [],
        },
      ],
    },
  ];
}
