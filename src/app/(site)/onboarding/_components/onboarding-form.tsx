"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  PackageIcon,
  Store,
  User2,
  UsersIcon,
  WrenchIcon,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { toastService } from "@dreamwalker-studios/toasts";
import { zodResolver } from "@hookform/resolvers/zod";
import { Shop, User } from "@prisma/client";

import { Survey } from "~/types/survey";
import { env } from "~/env";
import { useFileUpload } from "~/lib/file-upload/hooks/use-file-upload";
import { api } from "~/trpc/react";
import { useBeforeUnload } from "~/hooks/use-before-unload";
import { useDefaultMutationActions } from "~/hooks/use-default-mutation-actions";
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { LoadButton } from "~/components/common/load-button";
import { ImageFormField } from "~/components/inputs/image-form-field";

const formSchema = z.object({
  // Survey Fields
  businessType: z.string().min(1, { message: "Business type is required" }),
  experience: z.string().min(1, { message: "Experience level is required" }),
  description: z.string().min(1, { message: "Description is required" }),
  processes: z.string().optional(),
  materials: z.string().optional(),
  principles: z.string().optional(),

  // Shop Fields
  storeName: z.string().min(1, { message: "Shop name is required" }),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  bio: z.string().optional(),
  shopDescription: z.string().optional(),
  website: z.string().url().optional(),
  logo: z.string().optional(),
  profilePic: z.string().optional(),

  ownerPhoto: z.any().nullable(),
  logoPhoto: z.any().nullable(),

  ownerPhotoUrl: z.string().optional().nullable(),
  logoPhotoUrl: z.string().optional().nullable(),
});

export const OnboardingForm = ({
  surveyInitialData,
  shopInitialData,
}: {
  surveyInitialData: Survey | null;
  shopInitialData: (Shop & { owner?: User }) | null;
}) => {
  const [step, setStep] = useState(1);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { uploadFile, isUploading } = useFileUpload({
    route: "shops",
    api: "/api/upload-shop",
    generateThumbnail: false,
  });

  const { defaultActions: shopActions } = useDefaultMutationActions({
    entity: "shop",
  });

  const { defaultActions: surveyActions } = useDefaultMutationActions({
    entity: "survey",
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      businessType: surveyInitialData?.businessType ?? "",
      experience: surveyInitialData?.experience ?? "",
      description: surveyInitialData?.description ?? "",
      processes: surveyInitialData?.processes ?? "",
      materials: surveyInitialData?.materials ?? "",
      principles: surveyInitialData?.principles ?? "",
      storeName: shopInitialData?.name ?? "",
      firstName: shopInitialData?.owner?.name?.split(" ")[0] ?? "",
      lastName: shopInitialData?.owner?.name?.split(" ")[1] ?? "",
      bio: shopInitialData?.bio ?? "",
      shopDescription: shopInitialData?.description ?? "",
      website: shopInitialData?.website ?? "",
      ownerPhoto: null,
      logoPhoto: null,
    },
  });

  // Watch for form changes
  useEffect(() => {
    const subscription = form.watch(() => {
      setHasUnsavedChanges(true);
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  // Show warning when trying to close/refresh page with unsaved changes
  useBeforeUnload(
    hasUnsavedChanges,
    "You have unsaved changes. Are you sure you want to leave?",
  );

  const modifySurvey =
    api.survey.modifyFromOnboarding.useMutation(surveyActions);
  const createSurvey =
    api.survey.createFromOnboarding.useMutation(surveyActions);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      let ownerPhotoUrl = shopInitialData?.ownerPhoto;
      let logoPhotoUrl = shopInitialData?.logoPhoto;

      if (values.ownerPhoto) {
        ownerPhotoUrl = await uploadFile(values.ownerPhoto as File);
        if (!ownerPhotoUrl) {
          toastService.error("Error uploading owner photo");
          return;
        }
      }

      if (values.logoPhoto) {
        logoPhotoUrl = await uploadFile(values.logoPhoto as File);
        if (!logoPhotoUrl) {
          toastService.error("Error uploading logo");
          return;
        }
      }

      if (!surveyInitialData) {
        createSurvey.mutate({
          shopId: shopInitialData?.id,
          businessType: values.businessType ?? "",
          experience: values.experience ?? "",
          description: values.description ?? "",
          processes: values.processes ?? "",
          materials: values.materials ?? "",
          principles: values.principles ?? "",
          storeName: values.storeName ?? "",
          firstName: values.firstName ?? "",
          lastName: values.lastName ?? "",
          bio: values.bio ?? "",
          shopDescription: values.shopDescription ?? "",
          website: values.website ?? "",
          ownerPhoto: ownerPhotoUrl,
          logoPhoto: logoPhotoUrl,
        });
      } else {
        modifySurvey.mutate({
          shopId: shopInitialData?.id,
          surveyId: surveyInitialData.id,
          businessType: values.businessType ?? "",
          experience: values.experience ?? "",
          description: values.description ?? "",
          processes: values.processes ?? "",
          materials: values.materials ?? "",
          principles: values.principles ?? "",
          storeName: values.storeName ?? "",
          firstName: values.firstName ?? "",
          lastName: values.lastName ?? "",
          bio: values.bio ?? "",
          shopDescription: values.shopDescription ?? "",
          website: values.website ?? "",

          ownerPhoto: ownerPhotoUrl,
          logoPhoto: logoPhotoUrl,
        });
      }

      setHasUnsavedChanges(false);
      setStep(3);
    }
  };

  const isPending = modifySurvey.isPending || createSurvey.isPending;
  return (
    <div className="container mx-auto max-w-5xl py-8">
      {hasUnsavedChanges && (
        <div className="mb-4 rounded-md bg-yellow-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                You have unsaved changes
              </h3>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8">
        <div className="flex justify-between">
          <div
            className={`flex flex-col items-center ${step >= 1 ? "text-primary" : "text-gray-400"}`}
          >
            <CheckCircle2 className="mb-2 h-8 w-8" />
            <span>Survey</span>
          </div>
          <div
            className={`flex flex-col items-center ${step >= 2 ? "text-primary" : "text-gray-400"}`}
          >
            <Store className="mb-2 h-8 w-8" />
            <span>Shop Setup</span>
          </div>
          <div
            className={`flex flex-col items-center ${step >= 3 ? "text-primary" : "text-gray-400"}`}
          >
            <User2 className="mb-2 h-8 w-8" />
            <span>Complete</span>
          </div>
        </div>
      </div>

      <Card>
        {step === 1 && (
          <>
            <CardHeader>
              <CardTitle>Welcome to Artisanal Futures!</CardTitle>
              <CardDescription>
                Tell us about your craft and business so we can better support
                you.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
                  onChange={() => console.log(form.formState.errors)}
                  className="space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="businessType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          What type of business do you have?
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your business type"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="experience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          How long have you been practicing your craft?
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your years of experience"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tell us about your business</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="What makes your business unique? What are your values and goals?"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          This is different from what you have put on the shop
                          page: the more you can say, the better! Pretend its an
                          interview -- what can you say that gives folks a
                          deeper understanding? Start with the basics about your
                          products or services. What makes them special?
                          Cultural roots, healthy growing, precision
                          engineering, feminist practices? Your relations to the
                          community or customers?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="processes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            What are some processes you use? (optional)
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. woodworking, metalworking, digital fabrication"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="materials"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            What are some materials you work with? (optional)
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. wood, metal, fabric"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="principles"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            What are some principles when running your business?
                            (optional)
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. black owned, sustainability, LGBTQ+ / Gender neutral"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="pt-4">
                    <Button type="button" onClick={() => setStep(2)}>
                      Continue to Shop Setup
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </>
        )}

        {step === 2 && (
          <>
            <CardHeader>
              <CardTitle>Set Up Your Shop</CardTitle>
              <CardDescription>
                Create your shop presence on Artisanal Futures. You can always
                update this later.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <ImageFormField
                      form={form}
                      name="ownerPhoto"
                      label="Owner Photo (optional)"
                      className="col-span-1"
                      currentImageUrl={
                        shopInitialData
                          ? `${env.NEXT_PUBLIC_STORAGE_URL}/shops/${shopInitialData.ownerPhoto}`
                          : undefined
                      }
                    />
                    <ImageFormField
                      form={form}
                      name="logoPhoto"
                      label="Logo (optional)"
                      className="col-span-1"
                      currentImageUrl={
                        shopInitialData
                          ? `${env.NEXT_PUBLIC_STORAGE_URL}/shops/${shopInitialData.logoPhoto}`
                          : undefined
                      }
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="storeName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shop Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your shop name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name (optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Your first name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name (optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Your last name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shop URL (optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Your shop's web address"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Artisan Bio (optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe who you are and why you do what you do"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="shopDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shop Description (optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe your shop and what makes it special"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="pt-4">
                    <LoadButton type="submit" isLoading={isPending}>
                      Complete Setup
                    </LoadButton>
                    <Button
                      type="button"
                      variant="outline"
                      className="ml-4"
                      onClick={() => setStep(1)}
                    >
                      Back
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </>
        )}

        {step === 3 && (
          <>
            {modifySurvey.isPending || createSurvey.isPending ? (
              <CardContent className="flex items-center justify-center py-8">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                  <p className="text-sm text-muted-foreground">
                    Setting up your profile...
                  </p>
                </div>
              </CardContent>
            ) : (
              <>
                <CardHeader className="text-center">
                  <CardTitle className="text-3xl font-bold">
                    Welcome to Artisanal Futures! 🎉
                  </CardTitle>
                  <CardDescription className="mt-2 text-lg">
                    Congratulations on joining our community! Here&apos;s what
                    you can do next:
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
                  <Card className="transition-all hover:shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <UsersIcon className="h-6 w-6 text-primary" />
                        Join the Community
                      </CardTitle>
                      <CardDescription>
                        Connect with fellow artisans, share experiences, and
                        grow together
                      </CardDescription>
                    </CardHeader>
                    <CardFooter>
                      <Link href="/forum" className="w-full">
                        <Button className="w-full">Visit Forums</Button>
                      </Link>
                    </CardFooter>
                  </Card>

                  <Card className="transition-all hover:shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Store className="h-6 w-6 text-primary" />
                        Manage Your Shop
                      </CardTitle>
                      <CardDescription>
                        Customize your shop profile and showcase your unique
                        offerings
                      </CardDescription>
                    </CardHeader>
                    <CardFooter>
                      <Link href="/admin/shops" className="w-full">
                        <Button className="w-full">Go to Shop</Button>
                      </Link>
                    </CardFooter>
                  </Card>

                  <Card className="transition-all hover:shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PackageIcon className="h-6 w-6 text-primary" />
                        Add Products
                      </CardTitle>
                      <CardDescription>
                        List your handcrafted items and share their stories with
                        customers
                      </CardDescription>
                    </CardHeader>
                    <CardFooter>
                      <Link href="/admin/products" className="w-full">
                        <Button className="w-full">Go to Products</Button>
                      </Link>
                    </CardFooter>
                  </Card>

                  <Card className="transition-all hover:shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <WrenchIcon className="h-6 w-6 text-primary" />
                        Explore Tools
                      </CardTitle>
                      <CardDescription>
                        Access powerful tools designed to help your artisanal
                        business thrive
                      </CardDescription>
                    </CardHeader>
                    <CardFooter>
                      <Link href="/tools" className="w-full">
                        <Button className="w-full">View Tools</Button>
                      </Link>
                    </CardFooter>
                  </Card>
                </CardContent>
              </>
            )}
          </>
        )}
      </Card>
    </div>
  );
};
