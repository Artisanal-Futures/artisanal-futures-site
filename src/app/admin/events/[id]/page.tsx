import { cache } from "react";
import { notFound } from "next/navigation";

import { api } from "~/trpc/server";

import { EventForm } from "../_components/event-form";
import { TrailHeader } from "../../_components/trail-header";

type Props = {
  params: Promise<{ id: string }>;
};

// Deduped per request so the page and generateMetadata share one query.
const getEvent = cache((id: string) => api.event.get(id));

export default async function EditEventPage({ params }: Props) {
  const { id } = await params;
  const [event, shops] = await Promise.all([
    getEvent(id),
    api.shop.getOptions(),
  ]);
  if (!event) notFound();

  return (
    <>
      <TrailHeader
        breadcrumbs={[
          { label: "Events", href: "/admin/events" },
          { label: event?.title ?? "Event" },
        ]}
      />

      <EventForm initialData={event} shops={shops} />
    </>
  );
}
export const generateMetadata = async ({ params }: Props) => {
  const { id } = await params;
  const event = await getEvent(id).catch(() => null);
  if (!event) {
    return {
      title: "Event Not Found",
    };
  }
  return {
    title: `Edit ${event.title}`,
  };
};
