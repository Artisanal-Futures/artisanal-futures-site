import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";

import { cn } from "~/lib/utils";
import { Progress } from "~/components/ui/progress";

type SignupProgressProps = {
  currentStep: number;
  steps: { id: string | number; label: string }[];
  progress: number;
};

export function WizardSignupProgress({
  currentStep,
  steps,
  progress,
}: SignupProgressProps) {
  return (
    <header className="bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-10 border-b backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
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

        <div className="flex items-center gap-6">
          {/* Step indicators */}
          <nav
            className="hidden items-center gap-2 sm:flex"
            aria-label="Progress"
          >
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full text-xs font-medium transition-colors",
                    index < currentStep
                      ? "bg-primary text-primary-foreground"
                      : index === currentStep
                        ? "border-primary text-primary border-2"
                        : "border-border text-muted-foreground border",
                  )}
                >
                  {index < currentStep ? (
                    <Check className="size-3.5" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={cn(
                    "text-sm",
                    index === currentStep
                      ? "text-foreground font-medium"
                      : "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
                {index < steps.length - 1 && (
                  <div className="bg-border mx-2 h-px w-8" />
                )}
              </div>
            ))}
          </nav>
          <span className="text-muted-foreground text-sm sm:hidden">
            Step {currentStep + 1} of {steps.length}
          </span>
        </div>
      </div>
      <Progress value={progress} className="h-1 rounded-none" />
    </header>
  );
}
