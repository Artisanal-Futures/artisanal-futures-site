import { zodResolver } from "@hookform/resolvers/zod";
import Head from "next/head";
import Image from "next/image";
import { useRouter as useNavigationRouter } from "next/navigation";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import * as z from "zod";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import AuthLayout from "~/layouts/auth-layout";

const formSchema = z.object({
  password: z.string(),
});

const emailSchema = z.object({
  email: z.string().email(),
  name: z.string(),
  body: z.string(),
});

type PassCodeFormValues = z.infer<typeof formSchema>;
type EmailFormValues = z.infer<typeof emailSchema>;

const PasswordProtectPage = () => {
  const [loading] = useState(false);

  const [emailView, setEmailView] = useState(false);

  return (
    <AuthLayout>
      <div className=" my-auto flex h-full w-full items-center justify-around gap-5 max-md:flex-col-reverse">
        <div className="justify-left flex w-full flex-col gap-y-3 lg:w-6/12">
          {!emailView && <AuthForm loading={loading} />}
          {emailView && <EmailForm loading={loading} />}
          <Button variant={"link"} onClick={() => setEmailView(!emailView)}>
            {emailView
              ? "Have a code? Enter it here."
              : "Don't have a code? Get in contact with us!"}
          </Button>
        </div>

        <div className=" flex w-full px-4 max-md:max-w-xs max-md:py-4 lg:w-4/12">
          <Image
            src="/auth.svg"
            alt="under development"
            width={500}
            height={500}
          />
        </div>
      </div>
    </AuthLayout>
  );
};

const AuthForm = ({ loading }: { loading: boolean }) => {
  const router = useNavigationRouter();

  const [error, setError] = useState<string | null>(null);
  const form = useForm<PassCodeFormValues>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: PassCodeFormValues) => {
    const res = await fetch("/api/password-protect", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }).then((res) => res.json());

    if (res?.error) {
      setError(res.error as string);
      return;
    }

    if (res.success) {
      router.push("/sign-up");
    }
  };

  return (
    <>
      <h1 className="text-3xl font-semibold">
        Enter code to sign up to Artisanal Futures
      </h1>
      <p className="pt-2 font-medium text-muted-foreground">
        Welcome to Artisanal Futures! In order to maintain a truly free and
        collaborative environment, we invite others to join via a pass code. You
        can get a pass code from our admins or from one of our existing members!
      </p>
      <Form {...form}>
        <form
          onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
          className="py-5"
        >
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="sm:col-span-3">
                {error && (
                  <FormLabel className="label">
                    <span className="label-text text-error">{error}</span>
                  </FormLabel>
                )}
                <FormControl>
                  <Input
                    disabled={loading}
                    placeholder="e.g. Secret123"
                    {...field}
                    autoComplete="off"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />{" "}
          <Button
            disabled={loading}
            className="ml-auto mt-5 w-full"
            type="submit"
          >
            Authenticate
          </Button>
        </form>
      </Form>
    </>
  );
};
const EmailForm = ({ loading }: { loading: boolean }) => {
  const navigate = useNavigationRouter();

  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: undefined,
      name: undefined,
      body: undefined,
    },
  });

  const onSubmit = async (values: EmailFormValues) => {
    const req = await fetch("/api/send-inquiry", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });

    // if (req.status === 200) {
    //   toast.success("Email sent.");
    // } else {
    //   toast.error("Something went wrong. Please try again.");
    // }

    const res = await req.json();

    if (res?.statusCode) {
      const error = res?.message ?? "Something went wrong. Please try again.";
      toast.error(error as string);
      return;
    }

    toast.success("Email sent. We will get back to you shortly.");

    navigate.push("/");
    return;
  };
  return (
    <>
      <h1 className="text-2xl">Shoot us an email</h1>
      <Form {...form}>
        <form
          onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
          className="py-5"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="sm:col-span-3">
                <FormLabel className="label">
                  <span className="label-text text-error">Email</span>
                </FormLabel>
                <FormControl>
                  <Input
                    disabled={loading}
                    placeholder="e.g. hwest@test.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />{" "}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="sm:col-span-3">
                {" "}
                <FormLabel className="label">
                  <span className="label-text text-error">Name</span>
                </FormLabel>
                <FormControl>
                  <Input
                    disabled={loading}
                    placeholder="e.g. Henry West"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="body"
            render={({ field }) => (
              <FormItem className="sm:col-span-3">
                {" "}
                <FormLabel className="label">
                  <span className="label-text text-error">Body</span>
                </FormLabel>
                <FormControl>
                  <Textarea
                    disabled={loading}
                    placeholder="e.g. Hey! I am interested in joining the collective!"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />{" "}
          <Button className="ml-auto" type="submit">
            Email Us
          </Button>
        </form>
      </Form>
    </>
  );
};
export default PasswordProtectPage;
