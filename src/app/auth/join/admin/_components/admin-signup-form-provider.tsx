"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type { AdminSignupFormData } from "~/lib/validators/onboarding";
import { adminSignupFormSchema } from "~/lib/validators/onboarding";
import { Form } from "~/components/ui/form";

export type AdminStepDef = { id: number; name: string };

const STEPS: readonly AdminStepDef[] = [
  { id: 0, name: "Account" },
] as const;

type AdminSignupContextValue = {
  currentStep: number;
  steps: readonly AdminStepDef[];
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

  STEPS: readonly AdminStepDef[];
};

const AdminSignupContext = createContext<AdminSignupContextValue | null>(null);

export function useAdminSignup() {
  const ctx = useContext(AdminSignupContext);
  if (!ctx) {
    throw new Error(
      "useAdminSignup must be used within AdminSignupFormProvider",
    );
  }
  return ctx;
}

function getDefaultValues(initialCode?: string): Partial<AdminSignupFormData> {
  return {
    invitationCode: initialCode?.toUpperCase() ?? "",
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  };
}

type AdminSignupFormProviderProps = {
  initialCode?: string;
  children: React.ReactNode;
};

export function AdminSignupFormProvider({
  initialCode,
  children,
}: AdminSignupFormProviderProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [didAutoAdvanceFromInvite, setDidAutoAdvanceFromInvite] =
    useState(false);

  const [isAnimating, setIsAnimating] = useState(false);
  const [isCodeVerified, setIsCodeVerified] = useState(false);

  const [isComplete, setIsComplete] = useState(false);
  const progress = isComplete ? 100 : ((currentStep + 1) / STEPS.length) * 100;

  const form = useForm<AdminSignupFormData>({
    resolver: zodResolver(adminSignupFormSchema),
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

  const value: AdminSignupContextValue = {
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
    <AdminSignupContext.Provider value={value}>
      <Form {...form}>{children}</Form>
    </AdminSignupContext.Provider>
  );
}
