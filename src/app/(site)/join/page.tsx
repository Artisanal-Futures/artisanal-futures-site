import Link from "next/link";

import { cn } from "~/lib/utils";
import { buttonVariants } from "~/components/ui/button";

export default async function JoinPage() {
  return (
    <>
      <header className="site-header">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="tagline">Join Artisanal Futures</p>
            <h1>Interested in Joining Us?</h1>
          </div>
        </div>
      </header>
      <section className="site-section prose prose-sm lg:prose-base mb-6">
        <p>
          Thank you for your interest in the Artisanal Futures platform. We work
          with Detroit&apos;s small “mom and pop” sized businesses, as well as
          larger scale worker-owned companies, worker collectives and
          cooperatives. Places like urban farms, public makerspaces and the like
          are included as well, because they align with the goals of community
          benefit, sustainability and civic engagement. If you are not sure if
          you qualify, you can read more about the definition and{" "}
          <Link href="/join/criteria">criteria here</Link>, and submit an
          inquiry, on <Link href="/contact">our contact page</Link>.
        </p>

        <p>
          The “big picture” goal is to replace the extractive economy of big
          corporations, who put the lion&apos;s share in their own pockets, with
          a community-based economy that returns value to those who generate it.
          For businesses, the Artisanal Futures platform provides collaboration
          tools: for example, linking local supply chains such as farms and
          restaurants, or sharing access to AI or other technologies. For the
          public, it provides a marketplace where consumers are buying locally,
          saving money by buying in bulk, sharing knowledge, and engaging in
          other civic activities that might improve education and environments
          and even feed back into our business participants. Thus, it is a
          vision for the transition to a decolonized circular economy.
        </p>

        <p>
          We do not charge any fees or handle any transactions. Customers can
          search for your products or services on the platform, but they will be
          redirected to your website for making any online purchase.
        </p>

        <h2>Getting Started</h2>

        <p>
          To be part of the Artisanal Futures Platform, you need to get a code
          from us, or an existing artisan. Once you got that, go ahead and click
          the button below.
        </p>

        <div className="not-prose mt-6 flex flex-col gap-3 sm:flex-row sm:gap-4">
          <Link
            href="/join/artisan"
            className={cn(
              buttonVariants({ variant: "default" }),
              "border-primary w-full scale-105 border-2 font-semibold shadow-lg transition-transform hover:scale-110 sm:w-auto",
            )}
          >
            Join as an Artisan
          </Link>
          <Link
            href="/join/guest"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "w-full opacity-80 sm:w-auto",
            )}
          >
            Join as a Guest
          </Link>
        </div>

        <h2>The Required Steps</h2>
        <ol>
          <li>
            You will be taken to a wizard where you will be asked to enter an
            invitation code, and then fill in your account details.
          </li>
          <li>
            Once you have filled in your account details, we then ask you a few
            questions about your business, and your artisan profile (used to
            showcase your business to viewers on your store and in listings).
          </li>
          <li>
            Once that is finished, you will be taken to your dashboard, where
            you can manage your business and your artisan profile.
          </li>
          <li>
            You can then add your products to your store, and inquire about a
            website hosted by Artisanal Futures.
          </li>
          <li>
            You are encouraged to participate in the community forum and
            interact with the platform browsers through other artisans&apos;
            product offerings.
          </li>
        </ol>

        <h2>Disclaimer </h2>
        <p>
          The artisanal Futures platform encourages a collaborative and creative
          environment. While we strive to provide a positive experience, we must
          emphasize that:
        </p>
        <ul>
          <li>
            Artisans are responsible for the content they upload regarding their
            businesses.
          </li>
          <li>Please respect copyright and intellectual property rights.</li>
          <li>
            Any disputes should be resolved amicably within the community.
          </li>
        </ul>

        <h2>User Agreement</h2>
        <p>
          You agree to abide by our{" "}
          <Link href="/legal/privacy">Privacy Policy</Link>,{" "}
          <Link href="/legal/collective-agreement">
            The Artisanal Futures Collective Agreement
          </Link>
          , and <Link href="/legal/terms-of-service">Terms of Service</Link>.
          Please review them carefully.
        </p>

        <h2>Support</h2>
        <p>
          Questions? Reach out to our Support Team for assistance on the{" "}
          <Link href="/contact">Contact Us</Link> page.
        </p>
      </section>
    </>
  );
}

export const metadata = {
  title: "Join Artisanal Futures",
};
