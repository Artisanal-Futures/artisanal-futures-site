"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type { SignupFormData } from "~/lib/validators/onboarding";
import { artisanOnboardingSchema } from "~/lib/validators/onboarding";
import { Form } from "~/components/ui/form";

export type StepDef = { id: number; name: string };

export type ShopPrefill = {
  id: string;
  name: string;
  ownerName: string;
  bio: string | null;
  description: string | null;
  logoPhoto: string | null;
  ownerPhoto: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  attributeTags: string[];
};

const STEPS: readonly StepDef[] = [
  { id: 0, name: "Account" },
  { id: 1, name: "Business" },
  { id: 2, name: "Artisan profile" },
] as const;

const QUICK_JOIN_STEPS: readonly StepDef[] = [
  { id: 0, name: "Account" },
] as const;

const ACCOUNT_FIELDS: (keyof SignupFormData)[] = [
  "name",
  "email",
  "password",
  "confirmPassword",
];

type ArtisanSignupContextValue = {
  currentStep: number;
  steps: readonly StepDef[];
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

  attachedShop: { id: string; name: string } | null;
  applyShopPrefill: (shop: ShopPrefill) => void;

  skipOnboarding: boolean;
  applyInviteInfo: (info: { email?: string; skipOnboarding?: boolean }) => void;

  STEPS: readonly StepDef[];
};

const ArtisanSignupContext = createContext<ArtisanSignupContextValue | null>(
  null,
);

export function useArtisanSignup() {
  const ctx = useContext(ArtisanSignupContext);
  if (!ctx) {
    throw new Error(
      "useArtisanSignup must be used within ArtisanSignupFormProvider",
    );
  }
  return ctx;
}

function getDefaultValues(initialCode?: string): Partial<SignupFormData> {
  return {
    invitationCode: initialCode?.toUpperCase() ?? "",
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    businessName: "",
    businessInterview: "",
    businessLocation: "",
    businessEmail: "",
    businessTelephone: "",
    businessType: undefined,
    businessTypeOther: "",
    productCategories: [],
    productCategoriesOther: "",
    principles: [],
    principlesOther: "",
    commonProcesses: [],
    commonProcessesOther: "",
    materialsUsed: [],
    materialsUsedOther: "",
    websiteLink: "",
    socialMediaLinks: "",
    ownerName: "",
    ownerBio: "",
    publicDescription: "",
    logoFile: null,
    ownerPhotoFile: null,
    logoPhotoUrl: "",
    ownerPhotoUrl: "",
  };
}

type ArtisanSignupFormProviderProps = {
  initialCode?: string;
  children: React.ReactNode;
};

export function ArtisanSignupFormProvider({
  initialCode,
  children,
}: ArtisanSignupFormProviderProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [didAutoAdvanceFromInvite, setDidAutoAdvanceFromInvite] =
    useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [attachedShop, setAttachedShop] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const [skipOnboarding, setSkipOnboarding] = useState(false);

  const steps = skipOnboarding ? QUICK_JOIN_STEPS : STEPS;

  const [isComplete, setIsComplete] = useState(false);
  const progress = isComplete ? 100 : ((currentStep + 1) / steps.length) * 100;

  const form = useForm<SignupFormData>({
    resolver: zodResolver(artisanOnboardingSchema),
    defaultValues: getDefaultValues(initialCode),
  });

  const goNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length));
    } else {
      setIsComplete(true);
    }
  }, [currentStep, steps.length]);

  const goBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => Math.max(prev - 1, 0));
    }
  }, [currentStep]);

  const markAutoAdvancedFromInvite = useCallback(() => {
    setDidAutoAdvanceFromInvite(true);
  }, []);

  const applyShopPrefill = useCallback(
    (shop: ShopPrefill) => {
      setAttachedShop({ id: shop.id, name: shop.name });
      form.reset({
        ...form.getValues(),
        businessName: shop.name,
        businessEmail: shop.email ?? "",
        businessTelephone: shop.phone ?? "",
        websiteLink: shop.website ?? "",
        principles: shop.attributeTags,
        ownerName: shop.ownerName,
        ownerBio: shop.bio ?? "",
        publicDescription: shop.description ?? "",
        logoPhotoUrl: shop.logoPhoto ?? "",
        ownerPhotoUrl: shop.ownerPhoto ?? "",
      });
    },
    [form],
  );

  const applyInviteInfo = useCallback(
    (info: { email?: string; skipOnboarding?: boolean }) => {
      setSkipOnboarding(info.skipOnboarding === true);
      // Prefill only; the field stays editable (sign-up still enforces the
      // invite's email).
      if (info.email) form.setValue("email", info.email);
    },
    [form],
  );

  const value: ArtisanSignupContextValue = {
    currentStep,
    steps,
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

    attachedShop,
    applyShopPrefill,

    skipOnboarding,
    applyInviteInfo,

    STEPS: steps,
  };

  return (
    <ArtisanSignupContext.Provider value={value}>
      <Form {...form}>{children}</Form>
    </ArtisanSignupContext.Provider>
  );
}
