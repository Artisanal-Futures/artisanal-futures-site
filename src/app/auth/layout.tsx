import type { Metadata } from "next";

// Sign-in, sign-up and onboarding flows have no search value.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
