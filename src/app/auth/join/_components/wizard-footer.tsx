import { ArrowLeftCircle, ArrowRight, Check } from "lucide-react";

import { Button } from "~/components/ui/button";

type Props = {
  isPending?: boolean;
  isSubmitButton?: boolean;
  goBack: () => void;
  currentStep: number;
};
export function WizardFooter({
  isPending,
  isSubmitButton,
  goBack,
  currentStep,
}: Props) {
  return (
    <footer className="bg-background/95 supports-backdrop-filter:bg-background/60 sticky bottom-0 border-t backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
        <Button
          variant="ghost"
          type="button"
          onClick={goBack}
          disabled={currentStep === 0}
          className="gap-2"
        >
          <ArrowLeftCircle className="size-4" />
          Back
        </Button>

        {isSubmitButton ? (
          <Button type="submit" className="gap-2">
            <>
              {isPending ? (
                <>
                  <span className="saving-indicator" />
                  Submitting...
                </>
              ) : (
                <>
                  <Check className="size-4" />
                  Submit Application
                </>
              )}
            </>
          </Button>
        ) : (
          <Button type="submit" className="gap-2">
            <>
              Continue
              <ArrowRight className="size-4" />
            </>
          </Button>
        )}
      </div>
    </footer>
  );
}
