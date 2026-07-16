import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { AuthView } from "@daveyplate/better-auth-ui";
import { ArrowLeft } from "lucide-react";

import type { ErrorCode } from "../_components/auth-error-card";
import { cn } from "~/lib/utils";
import { auth } from "~/server/better-auth/config";
import { Button, buttonVariants } from "~/components/ui/button";

import { defaultError, errorConfigs } from "../_components/auth-error-card";

export const metadata = {
  title: "Error",
};
type Props = {
  searchParams: Promise<{ callbackUrl?: string; errorCode?: string }>;
};
export default async function SignInPage({ searchParams }: Props) {
  const { errorCode } = await searchParams;

  const config = !!errorCode
    ? errorConfigs[errorCode as ErrorCode]
    : defaultError;

  return (
    <div className="bg-background flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-border bg-card/50 border-b">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
          >
            <Image
              src="/logos/logo.png"
              alt="Artisanal Futures"
              width={150}
              height={60}
            />
          </Link>
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm transition-colors"
          >
            <ArrowLeft className="size-4" />
            Back to home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-md">
          {/* Error Card */}
          <div className="border-border bg-card overflow-hidden rounded-2xl border shadow-sm">
            {/* Icon Header */}
            <div className="bg-secondary/30 flex flex-col items-center gap-4 px-8 py-10">
              <div className="bg-destructive/10 text-destructive flex size-16 items-center justify-center rounded-full">
                {config?.icon}
              </div>
              <div className="text-center">
                <h1 className="text-foreground text-xl font-semibold">
                  {config?.title}
                </h1>
                {errorCode && (
                  <p className="text-muted-foreground mt-1 font-mono text-xs">
                    Error: {errorCode}
                  </p>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-col gap-6 px-8 py-8">
              <p className="text-muted-foreground text-center text-sm leading-relaxed">
                {config?.description}
              </p>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                {config?.actions?.map((action, index) => (
                  <Link
                    key={index}
                    href={action.href}
                    className={cn(
                      buttonVariants({ variant: action.variant ?? "default" }),
                      "w-full gap-2",
                    )}
                    {...(action.external
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                  >
                    {action.icon}
                    {action.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Help Text */}
          <p className="text-muted-foreground mt-6 text-center text-sm">
            Need help?{" "}
            <Link
              href="/contact"
              className="text-foreground hover:text-primary font-medium underline underline-offset-4"
            >
              Contact our support team
            </Link>
          </p>
        </div>
      </main>

      {/* Decorative Background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="bg-primary/5 absolute -top-40 -right-40 size-80 rounded-full blur-3xl" />
        <div className="bg-secondary absolute -bottom-40 -left-40 size-80 rounded-full blur-3xl" />
      </div>
    </div>
  );
}
