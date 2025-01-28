"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "~/utils/styles";
import {
  ArrowBigLeftDashIcon,
  LayoutGrid,
  StickyNote,
  Store,
  Trophy,
  User2,
  Users,
} from "lucide-react";

import type { Shop, Survey } from "@prisma/client";

import BlurImage from "~/components/ui/blur-image";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import Logo from "~/components/logo";
import Container from "~/app/_components/container";
import StepBtn from "~/app/(site)/onboarding/_components/step-btn";

import { MobileOnboardingNavigation } from "./mobile-onboarding-navigation";
import { OnboardingShopForm } from "./onboarding-shop-form";
import { OnboardingSurveyForm } from "./onboarding-survey-form";

type Steps = "get-started" | "survey" | "shop" | "next-steps";

type Props = {
  shop: Shop | null;
  survey: Survey | null;
};

export const OnboardingTabs = ({ shop, survey }: Props) => {
  const [currentStep, setCurrentStep] = useState<Steps>("get-started");

  return (
    <Tabs
      defaultValue={"get-started"}
      value={currentStep}
      onValueChange={(e) => setCurrentStep(e as Steps)}
      className="ignore-default fixed grid h-svh w-full overflow-hidden bg-slate-100/50 lg:grid-cols-[280px_1fr]"
    >
      <div className="fixed inset-0 z-10 hidden h-full translate-x-0 transform overflow-auto border-r bg-gray-100/40 transition-transform duration-200 ease-in-out dark:bg-gray-800/40 lg:static lg:z-auto lg:block lg:translate-x-0">
        <div className="flex h-full max-h-svh flex-col gap-2">
          <div className="flex h-[60px] items-center border-b bg-background/75 px-6">
            <Link href="/" className="flex items-center gap-x-2">
              <Logo className="w-[230.844px]" />
            </Link>
          </div>
          <div className="flex-1 overflow-auto py-2">
            <TabsList className="flex w-full justify-end space-y-8 bg-transparent lg:w-full lg:flex-col lg:items-start lg:justify-start lg:pt-24">
              <MobileOnboardingNavigation />
              <TabsTrigger
                value="get-started"
                className="flex w-full text-left max-lg:hidden"
              >
                <StepBtn
                  Icon={<User2 size={24} />}
                  title="Welcome"
                  subtitle="Learn about Artisanal Futures"
                  completed={currentStep !== "get-started"}
                />
              </TabsTrigger>
              <TabsTrigger
                value="survey"
                className="flex w-full text-left max-lg:hidden"
              >
                <StepBtn
                  Icon={<StickyNote size={24} />}
                  title="Quick Survey"
                  subtitle="Tell us about your craft"
                  completed={survey !== null}
                />
              </TabsTrigger>
              <TabsTrigger
                value="shop"
                className="flex w-full text-left max-lg:hidden"
              >
                <StepBtn
                  Icon={<Store size={24} />}
                  title="Shop Setup (Optional)"
                  subtitle="Set up your shop presence"
                  completed={shop !== null}
                />
              </TabsTrigger>
              <TabsTrigger
                value="next-steps"
                className="w-full items-start text-left max-lg:hidden"
              >
                <StepBtn
                  Icon={<Trophy size={24} />}
                  title="All Set!"
                  subtitle="See what's next"
                  completed={false}
                />
              </TabsTrigger>
            </TabsList>
          </div>
          <div className="mt-auto p-4">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle>Need a break?</CardTitle>
                <CardDescription>
                  You can always come back to complete your shop setup later.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/">
                  <Button className="w-full">
                    <ArrowBigLeftDashIcon />
                    Continue Later
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <main className="flex h-svh flex-col overflow-y-auto">
        <div className="sticky top-0 z-20 flex items-center gap-4 bg-white p-4">
          <Container
            className={cn(
              "hidden py-6",
              currentStep === "get-started" && "hidden",
            )}
          >
            <h1 className="text-3xl font-bold">
              {currentStep === "get-started" &&
                "      Welcome to Artisanal Futures!"}
              {currentStep === "shop" && "Setting up your shop"}
              {currentStep === "survey" && "Tell us about your business"}
              {currentStep === "next-steps" && "Next steps"}
            </h1>
            <p className="text-muted-foreground">
              {currentStep === "get-started" &&
                "We're glad you're here! Let's get you started."}
              {currentStep === "shop" &&
                "Let's set up your shop so you can start promoting. Info here is used to create your shop on the site. Any site visitor can see this information. You can always change it later."}
              {currentStep === "survey" &&
                "Help us understand what you do so we can better serve you."}
              {currentStep === "next-steps" &&
                "Now that you're all set up, let's explore what we have to offer."}
            </p>
          </Container>
        </div>
        <div className="flex h-full flex-col bg-gray-50/25 dark:bg-slate-900">
          <div className="relative flex w-full flex-1 items-center justify-center">
            <>
              <TabsContent value="get-started" className="mx-auto max-w-7xl">
                <Card>
                  <CardHeader>
                    <CardTitle>Welcome to Artisanal Futures!</CardTitle>
                    <CardDescription>
                      We&quot;re glad you&quot;re here! Let&quot;s get you
                      started.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center gap-4 space-y-2 p-8">
                    <div className="w-2/3 space-y-3">
                      <p>
                        Thank you for joining the Artisanal Futures platform.
                        Our mission is to help worker-owned businesses, worker
                        collectives, artisanal enterprise, and other forms of
                        grass-roots economic development and civic support. The
                        "big picture" goal is to replace the extractive economy
                        of big corporations, who put the lion&apos;s share in
                        their own pockets, with a community-based economy that
                        returns value to those who generate it. For businesses,
                        the Artisanal Futures platform provides collaboration
                        tools: for example, linking local supply chains such as
                        farms and restaurants, or sharing access to AI or other
                        technologies. For the public, it provides a marketplace
                        where consumers are buying locally, saving money by
                        buying in bulk, sharing knowledge, and engaging in other
                        civic activities that might improve education and
                        environments and even feed back into our business
                        participants. Thus, it is a vision for the transition to
                        a decolonized circular economy.
                      </p>{" "}
                      <p>
                        We do not charge any fees or handle any transactions.
                        Customers can search for your products or services on
                        the platform, but they will be redirected to your
                        website for making any online purchase.
                      </p>
                    </div>
                    <div className="relative aspect-[1.318] w-1/3">
                      <BlurImage src={"/diaogram.png"} alt="" />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      onClick={() => {
                        setCurrentStep("shop");
                      }}
                    >
                      Sounds Good, Let&apos;s Go!
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              <TabsContent value="shop" className="w-full px-0">
                <OnboardingShopForm
                  initialData={shop ?? null}
                  successCallback={() => setCurrentStep("next-steps")}
                />
              </TabsContent>{" "}
              <TabsContent value="survey" className="w-full px-0">
                <OnboardingSurveyForm
                  initialData={survey ?? null}
                  successCallback={() => setCurrentStep("next-steps")}
                />
              </TabsContent>
              <TabsContent value="next-steps" className="mx-auto max-w-7xl">
                <div className="mb-4">
                  <h2 className="text-3xl font-bold tracking-tight">Thanks!</h2>
                  <p className="text-normal text-muted-foreground">
                    Your shop has been created and your responses have been
                    successfully recorded. From here, you can:
                  </p>
                </div>

                <div className="flex h-full w-full flex-1 grow flex-col items-center justify-center gap-5 lg:flex-row">
                  <div className="w-full lg:w-1/3">
                    <Link href="/forum">
                      <Card className="w-full">
                        <CardHeader>
                          <CardTitle>Head to the Forms</CardTitle>
                          <CardDescription>
                            Introduce yourself to the community, create a forum
                            for your business, and more.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="flex h-fit flex-row justify-center">
                          <Users className="h-24 w-24" />
                        </CardContent>
                      </Card>
                    </Link>
                  </div>
                  <div className="w-full lg:w-1/3">
                    <Link href="/shops">
                      <Card className="w-full">
                        <CardHeader>
                          <CardTitle>Manage your Store</CardTitle>
                          <CardDescription>
                            Modify your store&apos;s information, add products,
                            and more.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="flex h-fit flex-row justify-center">
                          <Store className="h-24 w-24" />
                        </CardContent>
                      </Card>
                    </Link>
                  </div>
                  <div className="w-full lg:w-1/3">
                    <Link href="/tools">
                      <Card className="w-full">
                        <CardHeader>
                          <CardTitle> Check out our available apps</CardTitle>
                          <CardDescription>
                            From calculating optimal routes for deliveries to
                            playing with the power of AI, we have a lot to
                            offer.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="flex h-fit flex-row justify-center">
                          <LayoutGrid className="h-24 w-24" />
                        </CardContent>
                      </Card>
                    </Link>
                  </div>
                </div>
              </TabsContent>
            </>
          </div>
        </div>
      </main>
    </Tabs>
  );
};
