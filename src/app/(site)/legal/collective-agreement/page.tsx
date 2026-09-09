import Link from "next/link";

export default function CollectiveAgreementPage() {
  return (
    <>
      <header className="site-header">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="tagline">Legal</p>
            <h1>The Artisanal Futures Collective Agreement</h1>
          </div>
          <p className="description">Last updated: September 9th, 2026</p>
        </div>
      </header>

      <section className="site-section prose prose-sm lg:prose-base">
        <p>
          We are still drafting the Artisanal Futures Collective Agreement. It
          is not in effect, and it does not currently govern your use of the
          Services or any dispute related to them.
        </p>
        <p>
          Until it is published, our{" "}
          <Link
            href="/legal/terms-of-use"
            className="text-primary font-medium underline underline-offset-4"
          >
            Terms of Use
          </Link>{" "}
          are the binding agreement, including the dispute-resolution terms
          there.
        </p>
      </section>
    </>
  );
}

export const metadata = {
  title: "Collective Agreement",
  description: "The collective agreement for Artisanal Futures",
};
