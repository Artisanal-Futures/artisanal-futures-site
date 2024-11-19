import type { LucideIcon } from 'lucide-react'
import { ImageIcon, LayoutGrid, SquarePen } from 'lucide-react'

type Submenu = {
  href: string
  label: string
  active?: boolean
}

type Menu = {
  href: string
  label: string
  active?: boolean
  icon: LucideIcon
  submenus?: Submenu[]
}

type Group = {
  groupLabel: string
  menus: Menu[]
}

export function getMenuList(pathname: string): Group[] {
  return [
    {
      groupLabel: '',
      menus: [
        {
          href: `/admin/dashboard`,
          label: 'Dashboard',
          active: pathname.includes(`/admin/dashboard`),
          icon: LayoutGrid,
          submenus: [],
        },
      ],
    },

    {
      groupLabel: 'Tools',
      menus: [
        {
          href: `/admin/upcycling`,
          label: 'Upcycling',
          active: pathname.includes(`/admin/upcycling`),
          icon: ImageIcon,
          submenus: [],
        },
        {
          href: `/admin/guest-surveys`,
          label: 'Guest Surveys',
          active: pathname.includes(`/admin/guest-surveys`),
          icon: SquarePen,
          submenus: [],
        },
      ],
    },
  ]
}
