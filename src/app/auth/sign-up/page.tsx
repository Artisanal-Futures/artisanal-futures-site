"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "~/server/better-auth/client";

function SignUpForm({
  code,
  setCode,
  error,
  setError,
}: {
  code: string;
  setCode: (code: string) => void;
  error: string;
  setError: (error: string) => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const isValidated = !!searchParams.get("code");

  const handleOAuthSignUp = async (provider: "google" | "discord" | "auth0") => {
    if (code !== process.env.NEXT_PUBLIC_PASSWORD_PROTECT) {
      setError("Invalid or missing sign-up code");
      return;
    }

    try {
      setIsLoading(true);
      await authClient.signIn.social({
        provider,
        callbackURL: `/auth/callback?code=${code}`,
      });
    } catch (err) {
      setError("Failed to start sign-up. Please try again.");
      setIsLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (code !== process.env.NEXT_PUBLIC_PASSWORD_PROTECT) {
      setError("Invalid or missing sign-up code");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      await authClient.signUp.email({
        email,
        password,
        name,
        callbackURL: "/",
        fetchOptions: {
          onRequest: async (ctx) => {
            const body = await ctx.request.json();
            return new Request(ctx.request.url, {
              ...ctx.request,
              body: JSON.stringify({ ...body, code }),
            });
          },
        },
      });

      router.push("/");
    } catch (err: any) {
      setError(err?.message || "Sign-up failed. Please try again.");
      setIsLoading(false);
    }
  };

  if (!isValidated) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">Enter Sign-Up Code</h2>
          <p className="text-muted-foreground text-sm mb-4">
            You need a valid sign-up code to create an account.
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="code" className="text-sm font-medium">
            Sign-up Code
          </label>
          <input
            id="code"
            type="text"
            placeholder="Enter your sign-up code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (code === process.env.NEXT_PUBLIC_PASSWORD_PROTECT) {
                  router.push(`/auth/sign-up?code=${code}`);
                } else {
                  setError("Invalid sign-up code");
                }
              }
            }}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            required
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <button
          onClick={() => {
            if (code === process.env.NEXT_PUBLIC_PASSWORD_PROTECT) {
              router.push(`/auth/sign-up?code=${code}`);
            } else {
              setError("Invalid sign-up code");
            }
          }}
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full"
        >
          Continue
        </button>

        <p className="text-muted-foreground text-center text-sm">
          Already have an account?{" "}
          <Link href="/auth/sign-in" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Create your account</h2>
        <p className="text-muted-foreground text-sm">
          Choose your preferred sign-up method
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="space-y-3">
        <button
          onClick={() => handleOAuthSignUp("google")}
          disabled={isLoading}
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full"
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </button>

        <button
          onClick={() => handleOAuthSignUp("discord")}
          disabled={isLoading}
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full"
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="#5865F2">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
          </svg>
          Continue with Discord
        </button>

        <button
          onClick={() => handleOAuthSignUp("auth0")}
          disabled={isLoading}
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full"
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21.98 7.448L19.62 0H4.347L2.02 7.448c-1.352 4.312.03 9.206 3.815 12.015L12.007 24l6.157-4.537c3.755-2.81 5.182-7.688 3.815-12.015zM12 18a6 6 0 1 1 0-12 6 6 0 0 1 0 12z" />
          </svg>
          Continue with Auth0
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with email
          </span>
        </div>
      </div>

      <form onSubmit={handleEmailSignUp} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">
            Full Name
          </label>
          <input
            id="name"
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            required
            minLength={8}
          />
          <p className="text-xs text-muted-foreground">
            Must be at least 8 characters
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full disabled:opacity-50"
        >
          {isLoading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="text-muted-foreground text-center text-sm">
        Already have an account?{" "}
        <Link href="/auth/sign-in" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default function SignUpPage() {
  const searchParams = useSearchParams();
  const [code, setCode] = useState(searchParams.get("code") || "");
  const [error, setError] = useState("");
  const [isValidated, setIsValidated] = useState(!!searchParams.get("code"));

  // Validate code before showing auth form
  const validateCode = () => {
    if (code === process.env.NEXT_PUBLIC_PASSWORD_PROTECT) {
      setIsValidated(true);
      setError("");
    } else {
      setError("Invalid sign-up code");
    }
  };

  return (
    <div className="bg-background flex min-h-screen">
      <div className="bg-primary relative hidden overflow-hidden lg:flex lg:w-1/2">
        <div className="absolute inset-0 bg-[url('/image-father-daughter.png')] bg-cover bg-center opacity-20" />
        <div className="text-primary-foreground relative z-10 flex flex-col justify-between p-12">
          <Link
            href="/"
            className="text-primary-foreground flex w-fit items-center gap-2 transition-opacity hover:opacity-80"
          >
            <Image
              src="/logo-transparent.png"
              alt="Crossroads Community Association"
              width={100}
              height={100}
            />
          </Link>

          <div className="max-w-md">
            <h1 className="mb-4 text-4xl font-bold text-balance">
              Join Our Growing Community
            </h1>
            <p className="text-primary-foreground/80 mb-8 text-lg">
              Create your account to connect with neighbors, join clubs, and
              make a difference in District 3.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-primary-foreground/20 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <p className="text-primary-foreground/90 text-sm">
                  Access to 13+ active block clubs and community groups
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-primary-foreground/20 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <p className="text-primary-foreground/90 text-sm">
                  Member events and volunteer opportunities
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-primary-foreground/20 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <p className="text-primary-foreground/90 text-sm">
                  Resources and support for neighborhood improvement
                </p>
              </div>
            </div>
          </div>

          <div className="text-primary-foreground/60 text-sm">
            © 2026 Crossroads Community Association. All rights reserved.
            <span className="text-muted-foreground mx-2">|</span>
            Site by{" "}
            <a
              href="https://artisanalfutures.org"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground underline"
            >
              Artisanal Futures
            </a>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="bg-background sticky top-0 z-10 border-b p-4 lg:hidden">
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
            <div className="mb-8 flex items-center justify-center gap-2 lg:hidden">
              <div className="bg-primary flex h-10 w-10 items-center justify-center rounded-lg">
                <span className="text-primary-foreground text-sm font-bold">
                  CCA
                </span>
              </div>
              <span className="text-foreground text-xl font-bold">
                Crossroads Community Association
              </span>
            </div>

            <SignUpForm code={code} setCode={setCode} error={error} setError={setError} />

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
          By signing up, you agree to our{" "}
          <Link
            href="/policies/terms-of-service"
            className="text-primary hover:underline"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/policies/privacy-policy"
            className="text-primary hover:underline"
          >
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
