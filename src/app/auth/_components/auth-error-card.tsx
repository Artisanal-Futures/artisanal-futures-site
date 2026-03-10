import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  HelpCircle,
  Home,
  LogIn,
  Mail,
  RefreshCw,
  ShieldAlert,
  UserPlus,
  XCircle,
} from "lucide-react";

import { Button } from "~/components/ui/button";

export type ErrorCode =
  | "invalid_callback_request"
  | "state_not_found"
  | "state_mismatch"
  | "no_code"
  | "no_callback_url"
  | "oauth_provider_not_found"
  | "email_not_found"
  | "email_doesn't_match"
  | "unable_to_get_user_info"
  | "unable_to_link_account"
  | "account_already_linked_to_different_user"
  | "signup_disabled";

interface ErrorConfig {
  title: string;
  description: string;
  icon: React.ReactNode;
  actions: Array<{
    label: string;
    href: string;
    variant?: "default" | "outline" | "secondary";
    icon: React.ReactNode;
    external?: boolean;
  }>;
}

export const errorConfigs: Record<ErrorCode, ErrorConfig> = {
  invalid_callback_request: {
    title: "Invalid Request",
    description:
      "The authentication request was invalid or malformed. This can happen if the login link expired or was already used.",
    icon: <XCircle className="size-8" />,
    actions: [
      {
        label: "Try signing in again",
        href: "/auth/sign-in",
        variant: "default",
        icon: <RefreshCw className="size-4" />,
      },
      {
        label: "Go home",
        href: "/",
        variant: "outline",
        icon: <Home className="size-4" />,
      },
    ],
  },
  state_not_found: {
    title: "Session Expired",
    description:
      "Your authentication session has expired or could not be found. Please try signing in again.",
    icon: <AlertTriangle className="size-8" />,
    actions: [
      {
        label: "Sign in again",
        href: "/auth/sign-in",
        variant: "default",
        icon: <LogIn className="size-4" />,
      },
    ],
  },
  state_mismatch: {
    title: "Security Check Failed",
    description:
      "For your security, we couldn't verify this authentication request. This can happen if you have multiple tabs open or the request took too long.",
    icon: <ShieldAlert className="size-8" />,
    actions: [
      {
        label: "Try again",
        href: "/auth/sign-in",
        variant: "default",
        icon: <RefreshCw className="size-4" />,
      },
      {
        label: "Contact support",
        href: "/support",
        variant: "outline",
        icon: <HelpCircle className="size-4" />,
      },
    ],
  },
  no_code: {
    title: "Authorization Failed",
    description:
      "We didn't receive the expected authorization code from the sign-in provider. Please try again.",
    icon: <XCircle className="size-8" />,
    actions: [
      {
        label: "Sign in again",
        href: "/auth/sign-in",
        variant: "default",
        icon: <LogIn className="size-4" />,
      },
    ],
  },
  no_callback_url: {
    title: "Missing Redirect",
    description:
      "We couldn't determine where to send you after signing in. Please start the sign-in process again.",
    icon: <AlertTriangle className="size-8" />,
    actions: [
      {
        label: "Go to sign in",
        href: "/auth/sign-in",
        variant: "default",
        icon: <LogIn className="size-4" />,
      },
      {
        label: "Go home",
        href: "/",
        variant: "outline",
        icon: <Home className="size-4" />,
      },
    ],
  },
  oauth_provider_not_found: {
    title: "Provider Not Available",
    description:
      "The sign-in method you selected is not currently available. Please try a different sign-in option.",
    icon: <XCircle className="size-8" />,
    actions: [
      {
        label: "Choose another method",
        href: "/auth/sign-in",
        variant: "default",
        icon: <LogIn className="size-4" />,
      },
    ],
  },
  email_not_found: {
    title: "Email Not Found",
    description:
      "We couldn't find an account with this email address. If you're new here, you'll need to join the platform first.",
    icon: <Mail className="size-8" />,
    actions: [
      {
        label: "Join the platform",
        href: "/join",
        variant: "default",
        icon: <UserPlus className="size-4" />,
      },
      {
        label: "Try different email",
        href: "/auth/sign-in",
        variant: "outline",
        icon: <LogIn className="size-4" />,
      },
    ],
  },
  "email_doesn't_match": {
    title: "Email Mismatch",
    description:
      "The email from your sign-in provider doesn't match what we have on file. Please sign in with the email you originally registered with.",
    icon: <Mail className="size-8" />,
    actions: [
      {
        label: "Try again",
        href: "/auth/sign-in",
        variant: "default",
        icon: <RefreshCw className="size-4" />,
      },
      {
        label: "Contact support",
        href: "/support",
        variant: "outline",
        icon: <HelpCircle className="size-4" />,
      },
    ],
  },
  unable_to_get_user_info: {
    title: "Couldn't Retrieve Your Info",
    description:
      "We had trouble getting your information from the sign-in provider. This is usually temporary - please try again.",
    icon: <AlertTriangle className="size-8" />,
    actions: [
      {
        label: "Try again",
        href: "/auth/sign-in",
        variant: "default",
        icon: <RefreshCw className="size-4" />,
      },
    ],
  },
  unable_to_link_account: {
    title: "Couldn't Link Account",
    description:
      "We weren't able to link this sign-in method to your account. Please try again or contact support if the issue persists.",
    icon: <XCircle className="size-8" />,
    actions: [
      {
        label: "Try again",
        href: "/auth/sign-in",
        variant: "default",
        icon: <RefreshCw className="size-4" />,
      },
      {
        label: "Contact support",
        href: "/support",
        variant: "outline",
        icon: <HelpCircle className="size-4" />,
      },
    ],
  },
  account_already_linked_to_different_user: {
    title: "Account Already Linked",
    description:
      "This sign-in method is already connected to a different account. Please sign in with your original account or use a different sign-in method.",
    icon: <ShieldAlert className="size-8" />,
    actions: [
      {
        label: "Sign in differently",
        href: "/auth/sign-in",
        variant: "default",
        icon: <LogIn className="size-4" />,
      },
      {
        label: "Contact support",
        href: "/support",
        variant: "outline",
        icon: <HelpCircle className="size-4" />,
      },
    ],
  },
  signup_disabled: {
    title: "Account Not Found",
    description:
      "It looks like you don't have an account with us yet. Our platform is invite-only for artisans. If you're an artisan looking to join, you'll need to complete our registration process with an invite code.",
    icon: <UserPlus className="size-8" />,
    actions: [
      {
        label: "Join us",
        href: "/join",
        variant: "default",
        icon: <ArrowRight className="size-4" />,
      },
      {
        label: "Already have an account?",
        href: "/auth/sign-in",
        variant: "outline",
        icon: <LogIn className="size-4" />,
      },
    ],
  },
};

export const defaultError: ErrorConfig = {
  title: "Something Went Wrong",
  description:
    "We encountered an unexpected error during authentication. Please try again or contact support if the problem continues.",
  icon: <AlertTriangle className="size-8" />,
  actions: [
    {
      label: "Try again",
      href: "/auth/sign-in",
      variant: "default",
      icon: <RefreshCw className="size-4" />,
    },
    {
      label: "Go home",
      href: "/",
      variant: "outline",
      icon: <Home className="size-4" />,
    },
  ],
};
