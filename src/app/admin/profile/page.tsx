import { getSession } from "~/server/better-auth/server";

import { AdminClientLayout } from "../_components/client-layout";
import { ProfileForm } from "./_components/profile-form";

export const metadata = {
  title: "Profile",
};

export default async function ProfilePage() {
  const session = await getSession();

  return (
    <AdminClientLayout currentPage="Profile" title="Profile Settings">
      <div className="mx-auto max-w-2xl py-8">
        <ProfileForm {...session?.user} />
      </div>
    </AdminClientLayout>
  );
}
