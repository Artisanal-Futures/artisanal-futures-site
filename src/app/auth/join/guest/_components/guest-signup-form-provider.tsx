"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type { GuestSignupFormData } from "~/lib/validators/onboarding";
import { guestSignupFormSchema } from "~/lib/validators/onboarding";
import { Form } from "~/components/ui/form";

export type GuestStepDef = { id: number; name: string };

const STEPS: readonly GuestStepDef[] = [
  { id: 0, name: "Account" },
  { id: 1, name: "Location" },
  { id: 2, name: "Practices" },
] as const;

type GuestSignupContextValue = {
  currentStep: number;
  steps: readonly GuestStepDef[];
  goNext: () => void;
  goBack: () => void;
  didAutoAdvanceFromInvite: boolean;
  markAutoAdvancedFromInvite: () => void;
  isAnimating: boolean;
  setIsAnimating: (isAnimating: boolean) => void;
  isCodeVerified: boolean;
  setIsCodeVerified: (isCodeVerified: boolean) => void;
  progress: number;
  isComplete: boolean;

  STEPS: readonly GuestStepDef[];
};

const GuestSignupContext = createContext<GuestSignupContextValue | null>(null);

export function useGuestSignup() {
  const ctx = useContext(GuestSignupContext);
  if (!ctx) {
    throw new Error(
      "useGuestSignup must be used within GuestSignupFormProvider",
    );
  }
  return ctx;
}

function getDefaultValues(initialCode?: string): Partial<GuestSignupFormData> {
  return {
    invitationCode: initialCode?.toUpperCase() ?? "",
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    country: "",
    state: "",
    artisanalPractice: "",
    otherPractice: "",
  };
}

type GuestSignupFormProviderProps = {
  initialCode?: string;
  children: React.ReactNode;
};

export function GuestSignupFormProvider({
  initialCode,
  children,
}: GuestSignupFormProviderProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [didAutoAdvanceFromInvite, setDidAutoAdvanceFromInvite] =
    useState(false);

  const [isAnimating, setIsAnimating] = useState(false);
  const [isCodeVerified, setIsCodeVerified] = useState(false);

  const [isComplete, setIsComplete] = useState(false);
  const progress = isComplete ? 100 : ((currentStep + 1) / STEPS.length) * 100;

  const form = useForm<GuestSignupFormData>({
    resolver: zodResolver(guestSignupFormSchema),
    defaultValues: getDefaultValues(initialCode),
  });

  const goNext = useCallback(() => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    } else {
      setIsComplete(true);
    }
  }, [currentStep]);

  const goBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => Math.max(prev - 1, 0));
    }
  }, [currentStep]);

  const markAutoAdvancedFromInvite = useCallback(() => {
    setDidAutoAdvanceFromInvite(true);
  }, []);

  const value: GuestSignupContextValue = {
    currentStep,
    steps: STEPS,
    goNext,
    goBack,
    didAutoAdvanceFromInvite,
    markAutoAdvancedFromInvite,
    isAnimating,
    setIsAnimating,
    isCodeVerified,
    setIsCodeVerified,
    progress,
    isComplete,

    STEPS,
  };

  return (
    <GuestSignupContext.Provider value={value}>
      <Form {...form}>{children}</Form>
    </GuestSignupContext.Provider>
  );
}
