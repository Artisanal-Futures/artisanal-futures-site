'use client'

import { HamburgerMenuIcon } from '@radix-ui/react-icons'
import { StickyNote, Store, Trophy, User2 } from 'lucide-react'

import StepBtn from '~/app/(site)/onboarding/_components/step-btn'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '~/components/ui/sheet'
import { TabsTrigger } from '~/components/ui/tabs'

export const MobileOnboardingNavigation = () => {
  return (
    <Sheet>
      <SheetTrigger className="hidden max-lg:flex">
        <HamburgerMenuIcon />
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Artisanal Futures Onboarding</SheetTitle>
          <SheetDescription>
            If you are unable to finish up now, no worries! You can always
            complete the setup later in your account.
          </SheetDescription>

          <div className="w-full space-y-4">
            <TabsTrigger value="get-started" className="flex w-full text-left ">
              {' '}
              <StepBtn
                Icon={<User2 size={24} />}
                title="Getting Started"
                subtitle="Learn what Artisanal Futures is all about"
              />
            </TabsTrigger>
            <TabsTrigger value="shop" className="flex w-full text-left ">
              <StepBtn
                Icon={<Store size={24} />}
                title="Set up your shop"
                subtitle="Establish your presence"
              />
            </TabsTrigger>
            <TabsTrigger
              value="survey"
              className="w-full items-start text-left "
            >
              <StepBtn
                Icon={<StickyNote size={24} />}
                title="Tell us about your business"
                subtitle="Help us understand what you do"
              />
            </TabsTrigger>

            <TabsTrigger
              value="next-steps"
              className="w-full items-start text-left "
            >
              <StepBtn
                Icon={<Trophy size={24} />}
                title="Next steps"
                subtitle="Explore what we have to offer"
              />
            </TabsTrigger>
          </div>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  )
}
