import { api } from "~/trpc/server";

import { TrailHeader } from "../_components/trail-header";
import { InvitesClient } from "./_components/invites-client";

export default async function AdminInvitesPage() {
  const invites = await api.invite.listInvites();

  return (
    <>
      <TrailHeader
        breadcrumbs={[{ label: `Platform Invites (${invites?.length ?? 0})` }]}
      />
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <h1>Platform Invites</h1>
            <p>Send and manage invitation codes for Artisans and Guests</p>
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
