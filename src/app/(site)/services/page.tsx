import { NewServiceClient } from "./_components/new-service-client";

export const metadata = {
  title: "Services",
  description:
    "Search through all our artisans' services and support small businesses",
};

export default function ServicesPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-5xl font-bold tracking-tight">
          Artisanal Services
        </h1>
        <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
          Discover unique services offered by our talented artisans and
          support small businesses
        </p>
      </div>

      <div className="rounded-lg bg-background shadow-sm">
        <NewServiceClient />
      </div>
    </div>
  );
}