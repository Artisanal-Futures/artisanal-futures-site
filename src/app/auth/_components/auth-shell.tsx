import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type AuthShellProps = {
  children: React.ReactNode;
  aside?: React.ReactNode;
  asideImage?: string;
  footer?: React.ReactNode;
};

export function AuthShell({
  children,
  aside,
  asideImage,
  footer,
}: AuthShellProps) {
  const year = new Date().getFullYear();

  return (
    <div className="bg-background flex min-h-screen">
      {aside && (
        <div className="bg-primary/50 relative hidden overflow-hidden lg:flex lg:w-1/2">
          {asideImage && (
            <div
              className="absolute inset-0 bg-cover bg-center opacity-20"
              style={{ backgroundImage: `url(${asideImage})` }}
            />
          )}
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

            <div className="max-w-md">{aside}</div>

            <div className="text-primary-foreground/60 text-sm">
              © {year} Artisanal Futures. All rights reserved.
            </div>
          </div>
        </div>
      )}

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
            <div
              className={`mb-8 flex items-center justify-center ${
                aside ? "lg:hidden" : ""
              }`}
            >
              <Image
                src="/logos/logo.png"
                alt="Artisanal Futures"
                width={300}
                height={120}
              />
            </div>

            {children}

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

        {footer && (
          <div className="text-muted-foreground border-t p-4 text-center text-xs">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
