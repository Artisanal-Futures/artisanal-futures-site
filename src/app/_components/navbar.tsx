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
import { api } from "~/trpc/react";

import { ModeToggle } from "~/components/common/mode-toggle";
import Container from "~/app/_components/container";
import NavbarActions from "~/app/_components/navbar-actions";


const Navbar = () => {
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
  
  const { data: productCategories } = api.category.getNavigationTree.useQuery();

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

          <nav className="mx-6 hidden items-center space-x-4 lg:flex lg:space-x-6">
            {routes.map((route) =>
              route.label === "Products" ? (
                <NavigationMenu key={route.href}>
                  <NavigationMenuList>
                    <NavigationMenuItem>
                      <NavigationMenuTrigger className="px-1 text-lg font-medium lg:text-sm">Products</NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2">
                          {productCategories?.map((category) => (
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