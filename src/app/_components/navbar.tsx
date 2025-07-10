/* eslint-disable @next/next/no-img-element */
"use client";

import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";

import { ModeToggle } from "~/components/common/mode-toggle";
import Container from "~/app/_components/container";
import MainNav from "~/app/_components/main-nav";
import NavbarActions from "~/app/_components/navbar-actions";

const Navbar = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const categories = [
    {
      id: "shops",
      name: "Shops",
    },
    {
      id: "products",
      name: "Products",
    },
    {
      id: "services",
      name: "Services"
    },
    {
      id: "forums",
      name: "Forums",
    },
    {
      id: "tools",
      name: "Tools",
    },
  ];

  return (
    <div className="border-b">
      <Container>
        <div className="relative flex h-16 items-center px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-x-2 lg:ml-0">
            <Image
              className="block h-5 lg:hidden"
              src={isDark ? "/logo-mobile-dark.png" : "/logo_mobile.png"}
              alt="Artisanal Futures logo"
              width={20}
              height={20}
            />
            <img
              className="hidden h-5 w-auto lg:block"
              src={isDark ? "/logo-dark.png" : "/logo.png"}
              alt="Artisanal Futures logo"
            />
          </Link>

          {categories && (
            <MainNav data={categories} className="hidden lg:block" />
          )}

          <div className="ml-auto flex items-center space-x-6">
            <ModeToggle />
            <NavbarActions />
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Navbar;
