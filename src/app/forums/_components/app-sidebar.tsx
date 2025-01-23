'use client'

import * as React from 'react'
import { Clock, FileText, Home, Scale, Scroll } from 'lucide-react'
// import { TeamSwitcher } from "~/components/team-switcher";
import { useSession } from 'next-auth/react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '~/components/ui/sidebar'
import { api } from '~/trpc/react'
import { NavMain } from './nav-main'
import { NavProjects } from './nav-projects'
import { NavSignIn } from './nav-sign-in'
import { NavUser } from './nav-user'

// This is sample data.
const data = {
  projects: [
    {
      name: 'Content Policy',
      url: '/forums/content-policy',
      icon: Scroll,
    },
    {
      name: 'Privacy Policy',
      url: '/forums/privacy-policy',
      icon: Scale,
    },
    {
      name: 'User Agreement',
      url: '/forums/user-agreement',
      icon: FileText,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession()

  const subreddits = api.forumSubreddit.getNavigationSubreddits.useQuery()

  const mainNav = React.useMemo(() => {
    return [
      {
        title: 'Recent',
        url: '#',
        icon: Clock,
        isActive: true,
        items: subreddits.data?.map((subreddit) => ({
          title: `r/${subreddit.name}`,
          url: `/forums/r/${subreddit.name}`,
        })),
      },
    ]
  }, [subreddits.data])
  return (
    <Sidebar collapsible="icon" {...props}>
      {/* <SidebarHeader><TeamSwitcher teams={data.teams} /></SidebarHeader> */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Home className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    Artisanal Futures Forums
                  </span>
                  <span className="truncate text-xs">Back to Home</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={mainNav} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        {session?.user ? (
          <NavUser
            user={{
              name: session?.user?.name ?? '',
              email: session?.user?.email ?? '',
              avatar: session?.user?.image ?? '',
            }}
          />
        ) : (
          <NavSignIn />
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
