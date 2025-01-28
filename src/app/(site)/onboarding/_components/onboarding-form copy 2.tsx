"use client";

import { useState } from "react";
import { CheckCircle2, Store, UserCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { zodResolver } from "@hookform/resolvers/zod";

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
import LogoUpload from "~/components/ui/logo-upload";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { AddressFormField } from "~/components/inputs/address-autocomplete/address-form-field";

const formSchema = z.object({
  businessType: z.string().min(1, { message: "Business type is required" }),
  experience: z.enum(["beginner", "intermediate", "expert"], {
    required_error: "Experience level is required",
  }),
  goals: z.string().min(1, { message: "Goals are required" }),
  storeName: z.string().min(1, { message: "Store name is required" }),
  //   storeDescription: z
  //     .string()
  //     .min(1, { message: 'Store description is required' }),
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
  bio: z.string().min(1, { message: "Bio is required" }),

  processes: z.string().optional(),
  materials: z.string().optional(),
  principles: z.string().optional(),
  description: z.string().optional(),
  unmoderatedForm: z.boolean().default(false),
  moderatedForm: z.boolean().default(false),
  hiddenForm: z.boolean().default(false),
  privateForm: z.boolean().default(false),
  supplyChain: z.boolean().default(false),
  messagingOptIn: z.boolean().default(false),

  //   shopName: z.string().min(2),
  //   ownerName: z.string(),
  //   bio: z.string().optional(),
  //   description: z.string().optional(),
  logoPhoto: z.string().optional(),
  ownerPhoto: z.string().optional(),
  street: z.string().optional(),
  additional: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  website: z.string().optional(),
});

export const OnboardingForm = () => {
  const [step, setStep] = useState(1);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      businessType: "",
      experience: undefined,
      goals: "",
      storeName: "",
      //   storeDescription: '',
      firstName: "",
      lastName: "",
      bio: "",
      street: "",
      additional: "",
      city: "",
      state: "",
      zip: "",
      country: "",
      phone: "",
      email: "",
      website: "",

      logoPhoto: "",
      ownerPhoto: "",

      unmoderatedForm: false,
      moderatedForm: false,
      hiddenForm: false,
      privateForm: false,
      supplyChain: false,
      messagingOptIn: false,

      description: "",

      materials: "",
      principles: "",
      processes: "",

      //   ownerName: '',

      //   shopName: '',
    },
  });

  const handleNext = () => {
    setStep((prevStep) => prevStep + 1);
  };

  const handlePrevious = () => {
    setStep((prevStep) => prevStep - 1);
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log("Form submitted:", values);
    // Here you would typically send the data to your backend
    alert("Onboarding completed! Welcome aboard!");
  };

  return (
    <div className="flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle>Welcome! Let&apos;s get you set up</CardTitle>
          <CardDescription>
            Complete the following steps to finish your onboarding
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-8 flex justify-between">
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
              <span>Create Store</span>
            </div>
            <div
              className={`flex flex-col items-center ${step >= 3 ? "text-primary" : "text-gray-400"}`}
            >
              <UserCircle className="mb-2 h-8 w-8" />
              <span>Complete Profile</span>
            </div>
          </div>

          <Form {...form}>
            <form
              onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
              className="space-y-8"
            >
              {step === 1 && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-4">
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
                      name="experience"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>
                            How much experience do you have in e-commerce?
                          </FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-col space-y-1"
                            >
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="beginner" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Beginner
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="intermediate" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Intermediate
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="expert" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Expert
                                </FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="goals"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            What are your main goals for your online store?
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter your goals here"
                              className="resize-none"
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
                        <FormItem className="sm:col-span-3">
                          <FormLabel>
                            Tell us about you and your business.
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="e.g. Hey, my name is..."
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            This is different from what you have put on the shop
                            page: the more you can say, the better! Pretend its
                            an interview -- what can you say that gives folks a
                            deeper understanding? Start with the basics about
                            your products or services. What makes them special?
                            Cultural roots, healthy growing, precision
                            engineering, feminist practices? Your relations to
                            the community or customers?
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="processes"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-3">
                          <FormLabel>
                            What are some of your business processes?
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="e.g. textiles, bead making"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Some examples of processes could be: textiles,
                            woodworking, metalworking, digital fabrication,
                            print media, heating/cooling, solar,
                            farming/growing, and more!
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="materials"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-3">
                          <FormLabel>
                            What are some materials that go into your business?
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="e.g. satin, silk, cotton, wool"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Some examples of processes could be: cotton, yarn,
                            glass, dyes, inks, etc.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="principles"
                      render={({ field }) => (
                        <FormItem className="col-span-full max-md:pb-8">
                          <FormLabel>
                            What are some principles when running your business?
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="e.g. black owned, sustainability, LGBTQ+ / Gender neutral"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Some examples of principles could be: black owned,
                            female owned, community education, african american
                            civil rights, LGBTQ/Gender neutral, Carbon
                            neutral/sustainability and environmental
                            friendliness, etc.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="storeName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Store Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter your store name"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="logoPhoto"
                      render={({ field }) => (
                        <FormItem className="col-span-full md:col-span-3">
                          <FormLabel>Logo</FormLabel>
                          <FormDescription>
                            The logo for (or image representing) your shop
                          </FormDescription>
                          <FormControl>
                            <LogoUpload
                              value={field.value ?? ""}
                              onChange={(url) => field.onChange(url)}
                              onRemove={() => field.onChange("")}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem className="col-span-full md:col-span-2">
                          <FormLabel>Phone (optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. 123-456-7890" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem className="col-span-full md:col-span-2">
                          <FormLabel>Email (optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. emaail@test.co"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem className="col-span-full md:col-span-2">
                          <FormLabel>Website (optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. https://test.co"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <AddressFormField
                      form={form}
                      label="Business Address"
                      placeholder="e.g. 123 Main St, AnyTown, USA"
                    />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div className="flex space-x-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter your first name"
                              {...field}
                            />
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
                            <Input
                              placeholder="Enter your last name"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="ownerPhoto"
                    render={({ field }) => (
                      <FormItem className="col-span-full md:col-span-3">
                        <FormLabel>Picture of Owner </FormLabel>
                        <FormDescription>
                          Store image defaults to this when set
                        </FormDescription>
                        <FormControl>
                          <LogoUpload
                            value={field.value ?? ""}
                            onChange={(url) => field.onChange(url)}
                            onRemove={() => field.onChange("")}
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
                        <FormLabel>Bio</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell us about yourself"
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-between">
          {step > 1 && (
            <Button variant="outline" onClick={handlePrevious}>
              Previous
            </Button>
          )}
          {step < 3 ? (
            <Button onClick={handleNext}>Next</Button>
          ) : (
            <Button onClick={(e) => void form.handleSubmit(onSubmit)(e)}>
              Finish
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};
