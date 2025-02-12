import { getServerAuthSession } from "~/server/auth";

import { env } from "~/env";
import { Separator } from "~/components/ui/separator";
import DevelopmentChangeRole from "~/app/(site)/profile/_components/development-change-role";

import { ProfileForm } from "./_components/profile-form";

const isDev = env.NODE_ENV === "development";

export const metadata = {
  title: "Profile",
};

export default async function ProfilePage() {
  const session = await getServerAuthSession();

  return (
    <>
      <div className="space-y-6">
        <ProfileForm {...session?.user} />
        <Separator />
        {isDev && <DevelopmentChangeRole />}
      </div>
    </>
  );
}
