import { DonateForm } from "./_components/donate-form";

export default async function DonatePage() {
  return (
    <div className="site-container">
      <div className="site-header text-left">
        <h1 className="scroll-m-20 text-left text-4xl font-bold tracking-tight sm:text-5xl">
          Donate to Artisanal Futures!
        </h1>
        <p className="text-muted-foreground mt-4 w-full text-left text-lg">
          Support our mission to empower artisan communities and worker-owned
          businesses
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="flex flex-col space-y-6">
          <div className="space-y-4">
            <p className="text-base leading-7">
              Thank you for considering a donation to Artisanal Futures.
            </p>

            <p className="text-base leading-7">
              All of our administrators and researchers volunteer their time for
              free. But we still have to pay for the servers that host our
              platform, our software developer, and community-based projects
              like digital fabrication tools for worker-owned businesses.
            </p>

            <p className="text-base leading-7">
              Any amount would be appreciated: $5, $20, $50, or whatever feels
              right.
            </p>

            <p className="text-base leading-7 font-medium">Thank you!</p>
          </div>
        </div>

        <DonateForm />
      </div>
    </div>
  );
}

export const metadata = {
  title: "Donate to Artisanal Futures",
};
