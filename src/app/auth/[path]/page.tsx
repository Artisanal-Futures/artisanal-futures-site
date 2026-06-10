import { AuthView } from "@daveyplate/better-auth-ui";
import { authViewPaths } from "@daveyplate/better-auth-ui/server";

import { AuthShell } from "~/app/auth/_components/auth-shell";

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.values(authViewPaths).map((path) => ({ path }));
}

export default async function AuthPage({
  params,
}: {
  params: Promise<{ path: string }>;
}) {
  const { path } = await params;

  return (
    <AuthShell>
      <AuthView path={path} classNames={{ base: "max-w-full" }} />
    </AuthShell>
  );
}
