"use client";

import Link from "next/link";
import {
  ChevronsUpDown,
  LayoutDashboard,
  LogOut,
  UserRound,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

type Props = {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string | null;
  };
  /** Called when a menu item is chosen (e.g. to close the mobile overlay). */
  onNavigate?: () => void;
};

export function MobileAccountMenu({ user, onNavigate }: Props) {
  const initials =
    user.name
      ?.split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="border-border bg-card hover:bg-secondary flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors"
        >
          <Avatar className="size-9">
            <AvatarImage
              src={user.image ?? undefined}
              alt={user.name ?? "Account"}
            />
            <AvatarFallback>
              {initials || <UserRound className="size-4" />}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-foreground truncate text-sm font-medium">
              {user.name ?? "Account"}
            </p>
            {user.email && (
              <p className="text-muted-foreground truncate text-xs">
                {user.email}
              </p>
            )}
          </div>
          <ChevronsUpDown className="text-muted-foreground size-4 shrink-0" />
        </button>
      </DropdownMenuTrigger>
      {/* z-[70] so it layers above the mobile overlay (z-60) */}
      <DropdownMenuContent
        side="top"
        align="start"
        sideOffset={8}
        className="z-[70] w-[--radix-dropdown-menu-trigger-width] min-w-56"
      >
        <DropdownMenuItem asChild onClick={onNavigate}>
          <Link href="/profile">
            <UserRound className="size-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        {user.role === "ADMIN" && (
          <DropdownMenuItem asChild onClick={onNavigate}>
            <Link href="/admin">
              <LayoutDashboard className="size-4" />
              Admin Dashboard
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild onClick={onNavigate}>
          <Link href="/auth/sign-out">
            <LogOut className="size-4" />
            Sign out
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
