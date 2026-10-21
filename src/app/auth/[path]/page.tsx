import { AuthView } from "@daveyplate/better-auth-ui";
import { authViewPaths } from "@daveyplate/better-auth-ui/server";

import { RecaptchaNotice } from "~/components/inputs/recaptcha-notice";
import { AuthShell } from "~/app/auth/_components/auth-shell";

export const dynamicParams = false;

// Views with their own route folder under /auth. Prerendering them here too
// makes the production build serve this generic page in their place.
const OWN_ROUTES = new Set(["sign-in", "sign-up", "sign-out"]);

export function generateStaticParams() {
  return Object.values(authViewPaths)
    .filter((path) => !OWN_ROUTES.has(path))
    .map((path) => ({ path }));
}

export default async function AuthPage({
  params,
}: {
  params: Promise<{ path: string }>;
}) {
  const { path } = await params;

  return (
    <AuthShell
      footer={
        path === authViewPaths.FORGOT_PASSWORD ? <RecaptchaNotice /> : undefined
      }
    >
      <AuthView path={path} classNames={{ base: "max-w-full" }} />
    </AuthShell>
  );
}
