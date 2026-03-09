import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { AuthView } from "@daveyplate/better-auth-ui";
import { ArrowLeft } from "lucide-react";

import { setSignupCode } from "~/lib/actions";
import { auth } from "~/server/better-auth/config";

export const metadata = {
  title: "Sign In",
  description: "Sign in to your Crossroads Community Association account",
};
type Props = {
  searchParams: Promise<{ callbackUrl?: string }>;
};
export default async function SignInPage({ searchParams }: Props) {
  const year = new Date().getFullYear();
  const { callbackUrl } = await searchParams;

  return (
    <div className="bg-background flex min-h-screen">
      <div className="bg-primary/50 relative hidden overflow-hidden lg:flex lg:w-1/2">
        <div className="absolute inset-0 bg-[url('/image-bench.png')] bg-cover bg-center opacity-20" />
        <div className="text-primary-foreground relative z-10 flex flex-col justify-between p-12">
          <Link
            href="/"
            className="text-primary-foreground flex w-fit items-center gap-2 transition-opacity hover:opacity-80"
          >
            <Image
              src="/logos/logo.png"
              alt="Artisanal Futures"
              width={300}
              height={120}
            />
          </Link>

          <div className="max-w-md">
            <h1 className="mb-4 text-4xl font-bold text-balance">
              Welcome Back to Artisanal Futures
            </h1>
            <p className="text-primary-foreground/80 mb-8 text-lg">
              Sign in to access your account, browse our shops, and stay
              connected within our artisan community.
            </p>
          </div>

          <div className="text-primary-foreground/60 text-sm">
            © {year} Artisanal Futures. All rights reserved.
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col">
        <div className="border-b p-4 lg:hidden">
          <Link
            href="/"
            className="text-foreground flex w-fit items-center gap-2 transition-opacity hover:opacity-80"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back to Home</span>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center p-6 md:p-12">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center justify-center lg:hidden">
              <Image
                src="/logos/logo.png"
                alt="Artisanal Futures"
                width={300}
                height={120}
              />
            </div>

            <AuthView
              view="SIGN_IN"
              classNames={{ base: "max-w-full" }}
              redirectTo={callbackUrl}
            />

            <div className="mt-8 hidden text-left lg:block">
              <Link
                href="/"
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
            </div>
          </div>
        </div>

        <div className="text-muted-foreground border-t p-4 text-center text-xs">
          By signing in, you agree to our{" "}
          <Link
            href="/legal/terms-of-use"
            className="text-primary hover:underline"
          >
            Terms of Use
          </Link>{" "}
          and{" "}
          <Link href="/legal/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
