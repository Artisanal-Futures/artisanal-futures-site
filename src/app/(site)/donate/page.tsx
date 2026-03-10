import { DonateForm } from "./_components/donate-form";

export default async function DonatePage() {
  return (
    <>
      <header className="site-header">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="tagline">Want to support us?</p>
            <h1>Donate to Artisanal Futures!</h1>
          </div>
          <p className="description">
            Support our mission to empower artisan communities and worker-owned
            businesses.
          </p>
        </div>
      </header>

      <section className="site-section">
        <div className="grid min-h-[560px] grid-cols-1 overflow-hidden rounded-lg shadow-xl md:grid-cols-2 lg:grid-cols-6">
          <div className="relative col-span-1 flex flex-col items-center justify-end md:col-span-2 lg:col-span-3 lg:justify-center">
            {/* <div className="relative h-full w-full">
              <Image
                src={"/placeholder.svg"}
                alt=""
                fill
                className="object-cover object-bottom"
                sizes="100vw"
                priority
              />
            </div> */}{" "}
            <div className="prose prose-sm lg:prose-base space-y-4 p-8">
              <p>Thank you for considering a donation to Artisanal Futures.</p>

              <p>
                All of our administrators and researchers volunteer their time
                for free. But we still have to pay for the servers that host our
                platform, our software developer, and community-based projects
                like digital fabrication tools for worker-owned businesses.
              </p>

              <p>
                Any amount would be appreciated: $5, $20, $50, or whatever feels
                right.
              </p>

              <p className="font-bold">Thank you!</p>
            </div>
          </div>

          <div className="col-span-1 flex flex-col bg-[#f5f5f5] p-8 md:col-span-2 lg:col-span-3 lg:justify-center lg:p-12">
            <DonateForm />
          </div>
        </div>
      </section>
    </>
  );
}

export const metadata = {
  title: "Donate to Artisanal Futures",
};
