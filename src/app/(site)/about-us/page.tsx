import Image from "next/image";

export default function AboutUsPage() {
  return (
    <>
      <header className="site-header">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h1>About Artisanal Futures</h1>
          </div>
        </div>
      </header>
      <section className="site-section prose prose-sm lg:prose-base mb-6">
        <p>
          Thank you for joining the Artisanal Futures platform. Our mission is
          to help worker-owned businesses, worker collectives, artisanal
          enterprise, and other forms of grass-roots economic development and
          civic support. The &quot;big picture&quot; goal is to replace the
          extractive economy of big corporations, who put the lion&apos;s share
          in their own pockets, with a community-based economy that returns
          value to those who generate it. For businesses, the Artisanal Futures
          platform provides collaboration tools: for example, linking local
          supply chains such as farms and restaurants, or sharing access to AI
          or other technologies. For the public, it provides a marketplace where
          consumers are buying locally, saving money by buying in bulk, sharing
          knowledge, and engaging in other civic activities that might improve
          education and environments and even feed back into our business
          participants. Thus, it is a vision for the transition to a decolonized
          circular economy.
        </p>
        <div className="not-prose relative mx-auto aspect-4/3 w-full max-w-xl">
          <Image
            src="/af-graph.png"
            alt="About Us"
            fill
            className="not-prose object-contain"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>

        <p>
          We do not charge any fees or handle any transactions. Customers can
          search for your products or services on the platform, but they will be
          redirected to your website for making any online purchase.
        </p>
      </section>
    </>
  );
}

export const metadata = { title: "About Us" };
