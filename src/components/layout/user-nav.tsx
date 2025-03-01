"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, Store, User } from "lucide-react";
import { signIn, signOut, useSession } from "next-auth/react";

import type { Role } from "@prisma/client";

import { env } from "~/env";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

export const UserNav = () => {
  const { data: sessionData } = useSession();

  const authorizedRoles: Role[] = ["ADMIN", "ARTISAN"];
  const router = useRouter();
  const isImageUrl = (url: string) => {
    return url.startsWith("http");
  };
  if (!sessionData) {
    return (
      <>
        <Button
          onClick={sessionData ? () => void signOut() : () => void signIn()}
          variant={"ghost"}
          className="max-md:w-full"
        >
          Sign In
        </Button>
        <Button
          onClick={() => void router.push(`/auth/sign-up`)}
          className="max-md:w-full"
        >
          Sign Up
        </Button>
      </>
    );
  } else
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarImage
                src={
                  sessionData?.user?.image &&
                  isImageUrl(sessionData?.user?.image ?? "")
                    ? sessionData?.user?.image
                    : `${env.NEXT_PUBLIC_STORAGE_URL}/shops/${sessionData?.user?.image}`
                }
                alt={`@${sessionData?.user?.name}`}
              />
              <AvatarFallback>
                <User />
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium leading-none">
                  {sessionData?.user?.name}{" "}
                </p>

                <>
                  {sessionData?.user?.role === "USER" ||
                    (sessionData?.user?.role === "GUEST" && (
                      <User className="w-[0.875rem] text-sm font-medium" />
                    ))}
                </>
                <>
                  {sessionData?.user?.role === "ADMIN" && (
                    <ShieldCheck className="w-[0.875rem] text-sm font-medium" />
                  )}
                </>
                <>
                  {sessionData?.user?.role === "ARTISAN" && (
                    <Store className="w-[0.875rem] text-sm font-medium" />
                  )}
                </>
              </div>
              <p className="text-xs leading-none text-muted-foreground">
                {sessionData?.user?.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <Link href="/profile" className="w-full">
                Profile
              </Link>
            </DropdownMenuItem>
            {authorizedRoles.includes(sessionData?.user?.role) && (
              <>
                <DropdownMenuItem>
                  <Link href="/profile/shop" className="w-full">
                    Shop
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/profile/survey" className="w-full">
                    Survey
                  </Link>
                </DropdownMenuItem>
              </>
            )}
            {/* 
            {(sessionData?.user?.role === "GUEST" ||
              sessionData?.user?.role === "ADMIN") && (
              <DropdownMenuItem>
                <Link href="/guest-welcome" className="w-full">
                  Guest Survey
                </Link>
              </DropdownMenuItem>
            )} */}

            {/* {(sessionData?.user?.role === "ARTISAN" ||
              sessionData?.user?.role === "ADMIN") && (
              <DropdownMenuItem>
                <Link href="/artisan-welcome" className="w-full">
                  Artisan Survey
                </Link>
              </DropdownMenuItem>
            )}*/}

            {sessionData?.user?.role === "ADMIN" && (
              <DropdownMenuItem>
                <Link href="/admin/dashboard" className="w-full">
                  Admin Dashboard
                </Link>
              </DropdownMenuItem>
            )}

            {/* <DropdownMenuItem>
              <Link href="/onboarding" className="w-full">
                Onboarding
              </Link>
            </DropdownMenuItem> */}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => void signOut()}>
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
};
