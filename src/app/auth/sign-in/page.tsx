import Link from "next/link";
import { AuthView } from "@daveyplate/better-auth-ui";

import { AuthShell } from "~/app/auth/_components/auth-shell";

export const metadata = {
  title: "Sign In",
  description: "Sign in to your Crossroads Community Association account",
};

type Props = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

export default async function SignInPage({ searchParams }: Props) {
  const { callbackUrl } = await searchParams;

  return (
    <AuthShell
      aside={
        <>
          <h1 className="mb-4 text-4xl font-bold text-balance">
            Welcome Back to Artisanal Futures
          </h1>
          <p className="text-primary-foreground/80 mb-8 text-lg">
            Sign in to access your account, browse our shops, and stay
            connected within our artisan community.
          </p>
        </>
      }
      asideImage="/image-bench.png"
      footer={
        <>
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
        </>
      }
    >
      <AuthView
        view="SIGN_IN"
        classNames={{ base: "max-w-full" }}
        redirectTo={callbackUrl}
      />
    </AuthShell>
  );
}
