export default function CollectiveAgreementPage() {
  return (
    <>
      <header className="site-header">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="tagline">Legal</p>
            <h1>The Artisanal Futures Collective Agreement</h1>
          </div>
        </div>
      </header>

      <section className="site-section prose prose-sm lg:prose-base">
        <p>Work in progress. Check back soon!</p>
      </section>
    </>
  );
}

export const metadata = {
  title: "Collective Agreement",
  description: "The collective agreement for Artisanal Futures",
};
