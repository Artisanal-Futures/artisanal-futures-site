import { api } from "~/trpc/server";

import { TrailHeader } from "../_components/trail-header";
import { InvitesClient } from "./_components/invites-client";

export default async function AdminInvitesPage() {
  const invites = await api.invite.listInvites();
  const count = invites?.length ?? 0;

  return (
    <>
      <TrailHeader breadcrumbs={[{ label: "Invites" }]} />
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <h1>Platform Invites</h1>
            <p>
              {count} {count === 1 ? "invite" : "invites"}. Send and manage
              invitation codes for artisans, guests, and admins
            </p>
          </div>
        </div>
        <InvitesClient invites={invites ?? []} />
      </div>
    </>
  );
}

export const metadata = {
  title: "Platform Invites",
};
