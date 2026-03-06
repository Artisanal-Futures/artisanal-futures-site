/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@daveyplate/better-auth-ui";
import { Heart, LayoutDashboardIcon, X } from "lucide-react";
import { motion } from "motion/react";
import { useTheme } from "next-themes";

import { cn } from "~/lib/utils";
import { authClient } from "~/server/better-auth/client";
import { Button } from "~/components/ui/button";
import { navigationMenuTriggerStyle } from "~/components/ui/navigation-menu";
import { ModeToggle } from "~/components/common/mode-toggle";
import { HamburgerIcon } from "~/components/hamburger-icon";

const navLinks = [
  { href: "/shops", label: "Shops" },
  { href: "/product-categories", label: "Products" },
  { href: "/service-categories", label: "Services" },
  { href: "/forums", label: "Forums" },
  { href: "/tools", label: "Tools" },
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
        <Link href="/auth/sign-up">Join Us</Link>
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
        className="fixed inset-0 z-60 flex flex-col bg-[#1A1E1A] md:hidden"
        initial={false}
        animate={{
          opacity: mobileMenuOpen ? 1 : 0,
          pointerEvents: mobileMenuOpen ? "auto" : "none",
        }}
        transition={{ duration: 0.2 }}
      >
        {/* Close button - top right */}
        <button
          type="button"
          onClick={closeMenu}
          aria-label="Close menu"
          className="text-primary-foreground absolute top-4 right-4 z-10 rounded-full p-2 transition-colors hover:bg-white/10"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Logo + nav links centered */}
        <div className="flex flex-1 flex-col items-center justify-center px-4 pt-16 pb-8">
          {/* Logo above links */}
          <Link
            href="/"
            onClick={closeMenu}
            className="mb-12 flex shrink-0 items-center justify-center"
          >
            <Image
              src="/dpc-logo.png"
              alt="Detroit Pollinator Company"
              width={140}
              height={140}
              className="h-28 w-28 object-contain invert md:h-32 md:w-32"
            />
          </Link>

          <nav className="flex flex-col items-center gap-8">
            {navLinks.map(({ href, label }, i) => {
              const isActive =
                href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <motion.div
                  key={href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={
                    mobileMenuOpen
                      ? { opacity: 1, y: 0 }
                      : { opacity: 0, y: 20 }
                  }
                  transition={{
                    delay: mobileMenuOpen ? 0.05 + i * 0.05 : 0,
                    duration: 0.25,
                  }}
                >
                  <Link
                    href={href}
                    onClick={closeMenu}
                    className={`block rounded-lg px-4 py-2 text-2xl font-light tracking-wide uppercase transition-colors active:bg-white/10 ${
                      isActive
                        ? "text-[#5e7747]"
                        : "text-white hover:text-[#5e7747] active:text-[#5e7747]"
                    }`}
                  >
                    {label}
                  </Link>
                </motion.div>
              );
            })}
          </nav>

          {/* Mobile Auth/Actions - below links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={
              mobileMenuOpen ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
            }
            transition={{
              delay: mobileMenuOpen ? 0.05 + navLinks.length * 0.05 : 0,
              duration: 0.25,
            }}
            className="mt-12 flex flex-col items-center gap-4"
          >
            <Button
              size="sm"
              asChild
              className="border-green-500/30 bg-green-500/10 text-green-600 hover:bg-green-500/20 hover:text-green-700"
              variant="outline"
            >
              <Link href="/donate" onClick={closeMenu}>
                <Heart className="mr-1.5 h-4 w-4" />
                Donate
              </Link>
            </Button>

            {isPending ? (
              <div className="bg-muted h-9 w-24 animate-pulse rounded" />
            ) : user ? (
              <div className="flex items-center gap-2">
                <UserButton />
              </div>
            ) : (
              <div className="flex items-center gap-2">{authActions}</div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </>
  );
};
