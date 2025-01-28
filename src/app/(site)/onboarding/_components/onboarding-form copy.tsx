"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Store, User2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { zodResolver } from "@hookform/resolvers/zod";

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

const formSchema = z.object({
  // Survey Fields
  businessType: z.string().min(1, { message: "Business type is required" }),
  experience: z.enum(["beginner", "intermediate", "expert"], {
    required_error: "Experience level is required",
  }),
  description: z.string().min(1, { message: "Description is required" }),
  processes: z.string().optional(),
  materials: z.string().optional(),
  principles: z.string().optional(),

  // Optional Shop Fields
  storeName: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  bio: z.string().optional(),
});

export const OnboardingForm = () => {
  const [step, setStep] = useState(1);
  const [skipShop, setSkipShop] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      businessType: "",
      experience: undefined,
      description: "",
      processes: "",
      materials: "",
      principles: "",
      storeName: "",
      firstName: "",
      lastName: "",
      bio: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (step === 1) {
      // Submit survey data
      console.log("Survey submitted:", values);
      if (skipShop) {
        // Skip to completion if user doesn't want to set up shop
        setStep(3);
      } else {
        setStep(2);
      }
    } else if (step === 2) {
      // Submit shop data
      console.log("Shop setup:", values);
      setStep(3);
    }
  };

  return (
    <div className="container mx-auto max-w-5xl py-8">
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
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select business type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="retail">Retail</SelectItem>
                            <SelectItem value="service">Service</SelectItem>
                            <SelectItem value="manufacturing">
                              Manufacturing
                            </SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
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
                          This helps us understand how to better support you and
                          connect you with the right resources.
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
                          <FormLabel>What processes do you use?</FormLabel>
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
                            What materials do you work with?
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
                  </div>

                  <div className="pt-4">
                    <Button type="submit" onClick={() => setSkipShop(false)}>
                      Continue to Shop Setup
                    </Button>
                    <Button
                      type="submit"
                      variant="outline"
                      className="ml-4"
                      onClick={() => setSkipShop(true)}
                    >
                      Skip Shop Setup
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
                          <FormLabel>First Name</FormLabel>
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
                          <FormLabel>Last Name</FormLabel>
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
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shop Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell customers about your shop and what makes it special"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="pt-4">
                    <Button type="submit">Complete Setup</Button>
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
            <CardHeader>
              <CardTitle>Welcome to Artisanal Futures!</CardTitle>
              <CardDescription>
                You're all set! Here's what you can do next:
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Join the Community</CardTitle>
                  <CardDescription>Connect with other artisans</CardDescription>
                </CardHeader>
                <CardFooter>
                  <Link href="/forum">
                    <Button>Visit Forums</Button>
                  </Link>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Manage Your Shop</CardTitle>
                  <CardDescription>
                    Update your shop details and products
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Link href="/shops">
                    <Button>Go to Shop</Button>
                  </Link>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Explore Tools</CardTitle>
                  <CardDescription>Discover our business tools</CardDescription>
                </CardHeader>
                <CardFooter>
                  <Link href="/tools">
                    <Button>View Tools</Button>
                  </Link>
                </CardFooter>
              </Card>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
};
