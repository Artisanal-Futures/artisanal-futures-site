import Link from "next/link";

export const metadata = {
  title: "Takedown Policy",
  description: "The notice-and-takedown policy for Artisanal Futures",
};

export default function TakedownPolicyPage() {
  return (
    <>
      <header className="site-header">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="tagline">Legal</p>
            <h1>Takedown Policy</h1>
          </div>
          <p className="description">Last updated: September 9th, 2026</p>
        </div>
      </header>

      <section className="site-section prose prose-sm lg:prose-base mb-6">
        <h2>Introduction</h2>
        <p>
          This Takedown Policy explains how to ask Artisanal Futures to remove
          content from our website and services. It applies to artisan and shop
          profiles, product and service listings, events, our community forum,
          messaging, artisan websites we host, and our image generation app,
          &quot;UPCY&quot;.
        </p>
        <p>
          It sits alongside our{" "}
          <Link
            href="/legal/terms-of-use"
            className="text-primary font-medium underline underline-offset-4"
          >
            Terms of Use
          </Link>
          . You keep ownership of content you submit. We may remove or restrict
          access to material that breaks the law or those terms.
        </p>

        <h2>What we can and cannot remove</h2>
        <p>
          We can consider removing content that lives on Artisanal Futures,
          including:
        </p>
        <ul>
          <li>
            Shop, product, service, and event listings, including photos and
            descriptions on this site.
          </li>
          <li>Forum posts and comments.</li>
          <li>Messages and files stored on our services.</li>
          <li>
            UPCY uploads, prompts, generated images, and custom models or
            &quot;checkpoints&quot;.
          </li>
          <li>Websites we provision and host for artisans.</li>
        </ul>
        <p>
          We cannot take down pages, products, or purchases on an artisan&apos;s
          own website — for example a shop they run on Shopify, WordPress, or
          another host. Artisanal Futures is a directory and community hub. We
          are not a party to dealings between you and an artisan, and we do not
          handle those transactions.
        </p>

        <h2>When we will consider a takedown</h2>
        <p>We will review notices about content that appears to:</p>
        <ul>
          <li>
            <span className="font-bold">Infringe copyright or trademark</span>:
            material you own, or are authorized to represent, that someone else
            has posted without permission.
          </li>
          <li>
            <span className="font-bold">
              Break the law or our content standards
            </span>
            : illegal, harassing, abusive, or otherwise harmful content, or
            content that discloses someone else&apos;s private information.
          </li>
          <li>
            <span className="font-bold">
              Misuse traditional or community craft knowledge
            </span>
            : content that presents another community&apos;s traditional
            knowledge, designs, or practices as the poster&apos;s own in a way
            that harms the people or communities it comes from.
          </li>
          <li>
            <span className="font-bold">Violate UPCY rules</span>: uploads or
            generated images that copy others&apos; work without the necessary
            rights, or that depict a real, identifiable person without their
            consent.
          </li>
        </ul>

        <h2>How to send a notice</h2>
        <p>
          Email{" "}
          <a
            href="mailto:support@artisanalfutures.org"
            className="text-primary font-medium underline underline-offset-4"
          >
            support@artisanalfutures.org
          </a>{" "}
          with:
        </p>
        <ul>
          <li>Your name and a contact email address.</li>
          <li>
            A link to the material, or a clear description of what it is and
            where it appears on our services.
          </li>
          <li>
            Why it should come down — for example copyright, trademark, privacy,
            harassment, or traditional knowledge.
          </li>
        </ul>
        <p>
          If your notice is about copyright, please also include the following,
          which we use to evaluate copyright claims:
        </p>
        <ul>
          <li>
            A description of the copyrighted work you believe has been
            infringed.
          </li>
          <li>
            A statement that you have a good-faith belief that the use is not
            authorized by the copyright owner, its agent, or the law.
          </li>
          <li>
            A statement, under penalty of perjury, that the information in your
            notice is accurate and that you are the copyright owner or
            authorized to act on the owner&apos;s behalf.
          </li>
          <li>
            Your physical or electronic signature (typing your full name is
            enough).
          </li>
        </ul>

        <h2>What we do next</h2>
        <p>
          We review notices in good faith. We may remove or restrict access to
          the material, ask you for more information, or tell the person who
          posted it. Repeat or serious copyright abuse can lead to restriction,
          suspension, or closure of an account, as described in our{" "}
          <Link
            href="/legal/terms-of-use"
            className="text-primary font-medium underline underline-offset-4"
          >
            Terms of Use
          </Link>
          .
        </p>
        <p>
          We are not a court. We do not decide ownership disputes beyond what we
          need in order to operate our services. Sending a notice does not
          guarantee that the material will be removed.
        </p>

        <h2>Counter-notice for copyright</h2>
        <p>
          If we removed your content because of an alleged copyright
          infringement, and you believe that was a mistake — for example because
          you have permission, own the work, or the use is fair use — you may
          send a counter-notice to the same address.
        </p>
        <p>Your counter-notice should include:</p>
        <ul>
          <li>Your name, address, and a contact email address.</li>
          <li>
            Identification of the material that was removed and where it
            appeared before it was removed.
          </li>
          <li>
            A statement, under penalty of perjury, that you have a good-faith
            belief the material was removed by mistake or misidentification.
          </li>
          <li>
            A statement that you consent to the jurisdiction of the federal
            district court for your address (or for the Eastern District of
            Michigan if you are outside the United States), and that you will
            accept service of process from the person who sent the original
            notice or their agent.
          </li>
          <li>
            Your physical or electronic signature (typing your full name is
            enough).
          </li>
        </ul>
        <p>
          If we receive a valid counter-notice, we may restore the material
          unless the original complainant tells us they have filed a court
          action seeking to keep it down.
        </p>

        <h2>Changes to this policy</h2>
        <p>
          We may update this Takedown Policy from time to time to reflect
          changes in our practices or for legal, operational, or regulatory
          reasons. When we do, we will revise the &quot;Last updated&quot; date
          above and post the changes on this page.
        </p>

        <h2>Contact us</h2>
        <p>
          If you have questions about this Takedown Policy, or wish to send a
          notice, please contact us at{" "}
          <a
            href="mailto:support@artisanalfutures.org"
            className="text-primary font-medium underline underline-offset-4"
          >
            support@artisanalfutures.org
          </a>
          .
        </p>
      </section>
    </>
  );
}
