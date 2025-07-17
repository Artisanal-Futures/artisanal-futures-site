/* eslint-disable @next/next/no-img-element */
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from 'next/navigation'
import { useTheme } from "next-themes";
import { cn } from "~/utils/styles";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "~/components/ui/navigation-menu";

import { ModeToggle } from "~/components/common/mode-toggle";
import Container from "~/app/_components/container";
import NavbarActions from "~/app/_components/navbar-actions";
import { type Category } from "@prisma/client";

interface NavbarProps {
  categories: (Category & { children: Category[] })[];
}

const Navbar = ({ categories }: NavbarProps) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const pathname = usePathname();

  const routes = [
    { href: "/shops", label: "Shops" },
    { href: "/products", label: "Products" }, 
    { href: "/services", label: "Services" },
    { href: "/forums", label: "Forums" },
    { href: "/tools", label: "Tools" },
  ];
  
  return (
    <div className="relative z-20 border-b bg-background">
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

          <nav className="mx-6 hidden items-center space-x-4 lg:flex lg:space-x-6">
            {routes.map((route) =>
              route.label === "Products" ? (
                <NavigationMenu key={route.href}>
                  <NavigationMenuList>
                    <NavigationMenuItem>
                      <NavigationMenuTrigger className="px-1 text-lg font-medium lg:text-sm">Products</NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <div className="flex w-[600px] p-4">
                          <div className="w-1/3 pr-4">
                            <NavigationMenuLink asChild>
                              <a
                                className="from-muted/50 to-muted flex h-full w-full select-none flex-col justify-start rounded-md bg-gradient-to-b p-6 no-underline outline-none focus:shadow-md"
                                href="/categories"
                              >
                                <div className="mb-2 mt-4 text-lg font-medium">
                                  All Categories
                                </div>
                                <p className="text-sm leading-tight text-muted-foreground">
                                  Browse all our products by category and subcategory.
                                </p>
                              </a>
                            </NavigationMenuLink>
                          </div>
                          <ul className="grid w-2/3 grid-cols-2 gap-3">
                            {categories?.map((category) => (
                              <li key={category.id}>
                                <NavigationMenuLink asChild>
                                  <a
                                    href={`/category/${category.name.toLowerCase()}`}
                                    className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                  >
                                    <div className="text-sm font-medium leading-none">
                                      {category.name}
                                    </div>
                                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                      {category.children.map((c) => c.name).join(", ")}
                                    </p>
                                  </a>
                                </NavigationMenuLink>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                  </NavigationMenuList>
                </NavigationMenu>
              ) : (
                <Link
                  key={route.href}
                  href={route.href}
                  className={cn(
                    'text-lg font-medium transition-colors hover:text-black lg:text-sm',
                    pathname === route.href ? 'text-black' : 'text-neutral-500'
                  )}
                >
                  {route.label}
                </Link>
              )
            )}
          </nav>

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
