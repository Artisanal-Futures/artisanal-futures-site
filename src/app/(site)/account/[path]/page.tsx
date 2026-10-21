import type { Metadata } from "next";
import { AccountView } from "@daveyplate/better-auth-ui";
import { accountViewPaths } from "@daveyplate/better-auth-ui/server";

import { cn } from "~/lib/utils";
import { RecaptchaNotice } from "~/components/inputs/recaptcha-notice";

export const metadata: Metadata = {
  title: "Account",
  robots: { index: false, follow: false },
};

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.values(accountViewPaths).map((path) => ({ path }));
}

type Props = {
  params: Promise<{ path: string }>;
};

export default async function AccountPage({ params }: Props) {
  const { path } = await params;

  return (
    <div className={cn("py-20")}>
      <AccountView path={path} className="mx-auto max-w-7xl" classNames={{}} />
      {path === accountViewPaths.SECURITY && (
        <RecaptchaNotice className="mx-auto mt-6 max-w-7xl" />
      )}
    </div>
  );
}
