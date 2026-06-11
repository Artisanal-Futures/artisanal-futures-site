/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@daveyplate/better-auth-ui";
import {
  ChevronRight,
  Cog,
  Hammer,
  Heart,
  LayoutDashboardIcon,
  Mail,
  MessagesSquare,
  ShoppingBag,
  Store,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useTheme } from "next-themes";

import { cn } from "~/lib/utils";
import { authClient } from "~/server/better-auth/client";
import { Button } from "~/components/ui/button";
import { navigationMenuTriggerStyle } from "~/components/ui/navigation-menu";
import { ModeToggle } from "~/components/common/mode-toggle";
import { HamburgerIcon } from "~/components/hamburger-icon";

import { MobileAccountMenu } from "./mobile-account-menu";

const navLinks = [
  { href: "/shops", label: "Shops", icon: Store },
  { href: "/collections/products", label: "Products", icon: ShoppingBag },
  { href: "/collections/services", label: "Services", icon: Hammer },
  { href: "/forums", label: "Forums", icon: MessagesSquare },
  { href: "/tools", label: "Tools", icon: Cog },
  { href: "/contact", label: "Contact", icon: Mail },
];

export const SiteNavbar = () => {
  const { theme } = useTheme();
  const { data: sessionData, isPending } = authClient.useSession();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const user = sessionData?.user;
  const isDark = theme === "dark";
  const pathname = usePathname();

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const closeMenu = () => setMobileMenuOpen(false);

  const authActions = (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/auth/sign-in">Log in</Link>
      </Button>
      <Button size="sm" asChild>
        <Link href="/join">Join Us</Link>
      </Button>
    </div>
  );

  const userMenu = user && (
    <UserButton
      size="icon"
      classNames={{
        trigger: {
          base: "border-primary border",
          avatar: {
            base: "size-10",
          },
        },
      }}
      additionalLinks={[
        ...(user.role === "ADMIN"
          ? [
              {
                icon: <LayoutDashboardIcon className="h-4 w-4" />,
                label: "Admin",
                href: "/admin",
              },
            ]
          : []),
      ]}
    />
  );

  return (
    <>
      <header className="bg-background relative z-20 border-b">
        <div className="relative mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-x-2 lg:ml-0">
            <Image
              className="block h-7 w-auto lg:hidden"
              src={"/logos/logo-mobile.png"}
              alt="Artisanal Futures logo"
              width={20}
              height={20}
            />
            <img
              className="hidden h-7 w-auto lg:block"
              src={isDark ? "/logos/logo-dark.png" : "/logos/logo.png"}
              alt="Artisanal Futures logo"
            />
          </Link>

          <nav className="mx-6 hidden items-center space-x-2 lg:flex lg:space-x-2">
            {navLinks.map((route) => {
              return (
                <Link
                  key={route.href}
                  href={route.href}
                  className={cn(
                    "text-lg font-medium transition-colors hover:text-black lg:text-sm",
                    pathname === route.href ? "text-black" : "text-neutral-500",
                    navigationMenuTriggerStyle(),
                  )}
                >
                  {route.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center space-x-6">
            <ModeToggle />
            <Link
              href="/donate"
              className={cn(
                "flex items-center space-x-1 text-sm font-medium transition-colors hover:text-black lg:block",
                pathname === "/donate" ? "text-black" : "text-neutral-500",
              )}
            >
              <span className="block lg:hidden" role="img" aria-label="heart">
                ❤️
              </span>
              <span>Donate</span>
            </Link>
            {isPending ? (
              <div className="bg-muted h-8 w-8 animate-pulse rounded-full" />
            ) : user ? (
              userMenu
            ) : (
              authActions
            )}
          </div>
          <button
            type="button"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            className="flex touch-manipulation items-center justify-center p-2 md:hidden"
            onClick={() => setMobileMenuOpen((o) => !o)}
          >
            <HamburgerIcon open={mobileMenuOpen} />
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay - covers navbar (z-[60] > header z-50) */}
      <motion.div
        className="bg-background fixed inset-0 z-60 flex flex-col md:hidden"
        initial={false}
        animate={{
          opacity: mobileMenuOpen ? 1 : 0,
          pointerEvents: mobileMenuOpen ? "auto" : "none",
        }}
        transition={{ duration: 0.2 }}
      >
        {/* Top bar: logo left, close right */}
        <div className="border-border flex h-16 items-center justify-between border-b px-4">
          <Link href="/" onClick={closeMenu} className="flex items-center">
            <img
              src={isDark ? "/logos/logo-dark.png" : "/logos/logo.png"}
              alt="Artisanal Futures logo"
              className="h-7 w-auto"
            />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={closeMenu}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* App-style nav list */}
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="flex flex-col gap-1">
            {navLinks.map(({ href, label, icon: Icon }, i) => {
              const isActive =
                href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <motion.div
                  key={href}
                  initial={{ opacity: 0, x: -16 }}
                  animate={
                    mobileMenuOpen
                      ? { opacity: 1, x: 0 }
                      : { opacity: 0, x: -16 }
                  }
                  transition={{
                    delay: mobileMenuOpen ? 0.04 + i * 0.04 : 0,
                    duration: 0.25,
                  }}
                >
                  <Link
                    href={href}
                    onClick={closeMenu}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-3.5 text-base transition-colors",
                      isActive
                        ? "bg-secondary text-foreground font-semibold"
                        : "text-foreground hover:bg-secondary font-medium",
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-5 shrink-0",
                        isActive ? "text-foreground" : "text-muted-foreground",
                      )}
                    />
                    <span className="flex-1">{label}</span>
                    <ChevronRight className="text-muted-foreground/50 size-4 shrink-0" />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </nav>

        {/* Footer actions */}
        <div className="border-border space-y-3 border-t p-4">
          <Button
            asChild
            variant="outline"
            className="w-full border-red-500/30 text-red-600 hover:bg-red-500/10 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            <Link href="/donate" onClick={closeMenu}>
              <Heart className="mr-1.5 h-4 w-4" />
              Donate
            </Link>
          </Button>

          {isPending ? (
            <div className="bg-muted h-[60px] w-full animate-pulse rounded-xl" />
          ) : user ? (
            <MobileAccountMenu
              user={{
                name: user.name,
                email: user.email,
                image: user.image,
                role: user.role,
              }}
              onNavigate={closeMenu}
            />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Button asChild variant="outline">
                <Link href="/auth/sign-in" onClick={closeMenu}>
                  Log in
                </Link>
              </Button>
              <Button asChild>
                <Link href="/join" onClick={closeMenu}>
                  Join Us
                </Link>
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
};
