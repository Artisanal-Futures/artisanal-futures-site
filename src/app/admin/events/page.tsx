import { api } from "~/trpc/server";

import { TrailHeader } from "../_components/trail-header";
import { EventClient } from "./_components/event-client";

export default async function AdminCategoriesPage() {
  const events = await api.event.getAll();
  return (
    <>
      <TrailHeader breadcrumbs={[{ label: "Events" }]} />
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <h1>All Events</h1>
            <p>Manage events for AF</p>
          </div>
        </div>
        <EventClient events={events} />
      </div>
    </>
  );
}

export const metadata = {
  title: "Events",
};
