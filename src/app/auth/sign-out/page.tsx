import { AuthView } from "@daveyplate/better-auth-ui";

import { AuthShell } from "~/app/auth/_components/auth-shell";

export const metadata = {
  title: "Sign Out",
};

export default async function SignOutPage() {
  return (
    <AuthShell>
      <AuthView view="SIGN_OUT" classNames={{ base: "max-w-full" }} />
    </AuthShell>
  );
}
