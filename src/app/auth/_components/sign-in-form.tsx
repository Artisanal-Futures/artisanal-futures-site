'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import type { ReactNode } from 'react'
import { useState } from 'react'

// import { zodResolver } from "@hookform/resolvers/zod";
// import { signIn } from "next-auth/react";
// import { useForm } from "react-hook-form";
// import { type z } from "zod";

// import { InputFormField } from "~/components/common/input-form-field";
// import { LoadButton } from "~/components/common/load-button";
// import { PasswordFormField } from "~/components/common/password-form-field";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'

// import { Form, FormLabel } from "@dws/ui/blocks/form";
// import { LoginSchema } from "~/schemas/auth";

type Props = {
  children: ReactNode
}
export default function SignInForm({ children }: Props) {
  const [loading, isLoading] = useState(false)
  const searchParams = useSearchParams()

  // const form = useForm<z.infer<typeof LoginSchema>>({
  //   resolver: zodResolver(LoginSchema),
  //   defaultValues: { email: "", password: "" },
  // });

  // const onSubmit = (data: z.infer<typeof LoginSchema>) => {
  //   isLoading(true);
  //   void signIn("login", {
  //     email: data.email,
  //     password: data.password,
  //     callbackUrl: searchParams.get("callbackUrl") ?? "/",
  //   }).catch(() => {
  //     isLoading(false);
  //   });
  // };

  return (
    // <Form {...form}>
    //   <form
    //     onSubmit={form.handleSubmit(onSubmit)}
    //     className="mt-8 w-full space-y-6"
    //   >
    <>
      <CardHeader>
        <CardTitle className="text-center text-2xl">
          Login to Ubuntu-AI
        </CardTitle>
        <CardDescription className="text-center">
          Enter your email below to login to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {/* <div className="grid gap-2">
              <InputFormField
                form={form}
                name="email"
                label="Email"
                placeholder="m@example.com"
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <FormLabel htmlFor="password">Password</FormLabel>
                <Link
                  href="/auth/forgot-password"
                  className="ml-auto inline-block text-sm underline"
                >
                  Forgot your password?
                </Link>
              </div>
              <PasswordFormField
                form={form}
                name="password"
                placeholder="12345"
              />
            </div>

            <LoadButton
              type="submit"
              isLoading={loading}
              loadingText="Logging in..."
              className="flex w-full gap-1"
            >
              Login
            </LoadButton> */}

          <div className="flex w-full gap-2">{children}</div>
        </div>

        <p className="w-full py-4 text-center font-medium text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href={'/auth/register'} className="underline">
            <span className="font-bold hover:text-slate-800">Sign up</span>
          </Link>
        </p>
      </CardContent>
    </>
    //   </form>
    // </Form>
  )
}
