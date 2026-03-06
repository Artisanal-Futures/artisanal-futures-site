import { GuestWizardClient } from "./_components/guest-wizard-client";

type Props = {
  searchParams: Promise<{ code?: string }>;
};

export default async function GuestJoinPage({ searchParams }: Props) {
  const { code } = await searchParams;

  return (
    <>
      <header className="mx-auto max-w-7xl px-4 pt-12 pb-6 sm:px-6 sm:pt-16 sm:pb-8 lg:px-8">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-muted-foreground text-sm font-medium tracking-widest uppercase">
              Join Artisanal Futures
            </p>
            <h1 className="text-foreground text-3xl font-bold tracking-tight text-balance sm:text-4xl lg:text-5xl">
              Become a Guest
            </h1>
          </div>
        </div>
      </header>
      <section className="page-container">
        <GuestWizardClient initialCode={code} />
      </section>
    </>
  );
}

export const metadata = {
  title: "Become a Guest",
};
