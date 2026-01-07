/* eslint-disable @next/next/no-img-element */
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "~/utils/styles";
import { useTheme } from "next-themes";

import { navigationMenuTriggerStyle } from "~/components/ui/navigation-menu";
import { ModeToggle } from "~/components/common/mode-toggle";
import Container from "~/app/_components/container";
import NavbarActions from "~/app/_components/navbar-actions";

const Navbar = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const pathname = usePathname();

  const routes = [
    { href: "/shops", label: "Shops" },
    { href: "/product-categories", label: "Products" },
    { href: "/service-categories", label: "Services" },
    { href: "/forums", label: "Forums" },
    { href: "/tools", label: "Tools" },
  ];

  return (
    <div className="relative z-20 border-b bg-background">
      <Container>
        <div className="relative flex h-16 items-center px-4 sm:px-6 lg:px-8">
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
            {routes.map((route) => {
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
            <NavbarActions />
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Navbar;
