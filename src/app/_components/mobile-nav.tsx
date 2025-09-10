import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { HamburgerMenuIcon } from '@radix-ui/react-icons'
import { ShieldCheck, Store, User } from 'lucide-react'
import { signIn, signOut, useSession } from 'next-auth/react'

import { api } from '~/trpc/react'
import { cn } from '~/utils/styles'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Button } from '~/components/ui/button'
import { Separator } from '~/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '~/components/ui/sheet'
// Import the Accordion components
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '~/components/ui/accordion'

export const MobileNav = ({
  links,
}: {
  links: { id: string; name: string }[]
}) => {
  const { data: sessionData } = useSession()
  const pathname = usePathname()

  // Fetch the category data needed for the dropdown
  const { data: categoryTree } = api.category.getNavigationTree.useQuery();

  return (
    <Sheet>
      <SheetTrigger asChild className="lg:hidden">
        <Button variant="ghost" size="icon">
          <HamburgerMenuIcon className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side={'top'}>
        <SheetHeader>
          <SheetTitle>
            <Link href="/" className="flex w-fit items-center gap-x-2">
              <span className="flex items-center gap-1">
                <Image
                  className="block h-5"
                  src="/img/logo_mobile.png"
                  alt="Artisanal Futures logo"
                  width={20}
                  height={20}
                />
                <p className="font-normal text-black">Artisanal Futures</p>
              </span>
            </Link>
          </SheetTitle>
        </SheetHeader>

        {/* --- START: UPDATED NAVIGATION LOGIC --- */}
        {/* We replace the old <MainNav> with this new logic */}
        <nav className="mt-8 flex flex-col space-y-2">
          {links.map((route) => {
            // If the link is "Products", render an Accordion
            if (route.name === 'Products') {
              return (
                <Accordion key={route.id} type="single" collapsible>
                  <AccordionItem value="products" className="border-b-0">
                    <AccordionTrigger className="py-4 text-lg font-medium transition-colors hover:no-underline">
                      Products
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2 pl-4">
                      {/* Link to the main categories page */}
                      <Link
                        href="/categories"
                        className="block rounded-md p-2 text-muted-foreground hover:bg-accent"
                      >
                        All Categories
                      </Link>
                      {/* Links to each individual category */}
                      {categoryTree?.map((category) => (
                        <Link
                          key={category.id}
                          href={`/category/${category.name.toLowerCase()}`}
                          className="block rounded-md p-2 text-muted-foreground hover:bg-accent"
                        >
                          {category.name}
                        </Link>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              );
            }
            // Otherwise, render a normal link
            return (
              <Link
                key={route.id}
                href={`/${route.id}`}
                className={cn(
                  'py-4 text-lg font-medium transition-colors',
                  pathname === `/${route.id}` ? 'text-black' : 'text-neutral-500',
                )}
              >
                {route.name}
              </Link>
            );
          })}
        </nav>
        {/* --- END: UPDATED NAVIGATION LOGIC --- */}

        <Separator className="my-4" />
        <SheetFooter className="flex flex-row justify-center gap-2">
          {/* ... Your existing session/login buttons ... */}
          {!sessionData?.user && (
            <>
              <Button className="flex-1" onClick={() => void signIn()}>
                Log in
              </Button>
              <Link href="/auth/sign-up">
                <Button variant="secondary" className="flex-1">
                  Sign up
                </Button>
              </Link>
            </>
          )}

          {sessionData?.user && (
            <>
              <div className="flex w-full flex-row items-center justify-between pt-4">
                <Link href="/profile" className=" flex items-center gap-2 ">
                  <Avatar>
                    <AvatarImage
                      src={sessionData.user.image!}
                      alt={sessionData.user.name!}
                    />
                    <AvatarFallback>{sessionData.user.name}</AvatarFallback>
                  </Avatar>
                  <p className="flex flex-col ">
                    <span className="flex gap-1">
                      {sessionData?.user?.name}
                      <>
                        {sessionData?.user?.role == 'USER' && (
                          <User className="w-[0.875rem] text-sm font-medium" />
                        )}
                      </>
                      <>
                        {sessionData?.user?.role == 'ADMIN' && (
                          <ShieldCheck className="w-[0.875rem] text-sm font-medium" />
                        )}
                      </>
                      <>
                        {sessionData?.user?.role == 'ARTISAN' && (
                          <Store className="w-[0.875rem] text-sm font-medium" />
                        )}
                      </>
                    </span>
                    <span>{sessionData?.user?.email}</span>
                  </p>
                </Link>

                <Button onClick={() => void signOut()} variant={'outline'}>
                  Not you? Sign out
                </Button>
              </div>
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
