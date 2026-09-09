import Link from "next/link";

export const metadata = {
  title: "Artisanal Futures Forums Content Policy",
};

export default function ContentPolicy() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold text-foreground">
        Artisanal Futures Forums Content Policy
      </h1>

      <div className="space-y-8">
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-foreground">
            Our Commitment
          </h2>
          <p className="text-muted-foreground">
            Artisanal Futures is committed to fostering an open, respectful, and
            collaborative community. Our forums exist to facilitate meaningful
            discussions and knowledge sharing around artisanal practices,
            sustainable crafts, and community-driven initiatives.
          </p>
          <p className="mt-4 text-muted-foreground">
            These are community guidelines. They sit alongside our{" "}
            <Link
              href="/legal/terms-of-use"
              className="text-primary font-medium underline underline-offset-4"
            >
              Terms of Use
            </Link>
            , which are the binding rules for using Artisanal Futures. If the
            two ever differ, the Terms of Use control.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold text-foreground">
            Community Guidelines
          </h2>
          <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
            <li>Be respectful and constructive in discussions</li>
            <li>Do not post harmful, hateful, or discriminatory content</li>
            <li>Avoid spam and excessive self-promotion</li>
            <li>
              Respect intellectual property and traditional craft knowledge
            </li>
            <li>Do not share personal or sensitive information</li>
            <li>Support sustainable and ethical practices</li>
            <li>Follow relevant laws and regulations</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold text-foreground">
            Content Moderation
          </h2>
          <p className="text-muted-foreground">
            We moderate content to maintain a safe and productive environment
            for artisans and community members. Content that violates our
            guidelines or the Terms of Use may be removed, and repeated
            violations may result in account suspension or termination.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold text-foreground">
            Privacy
          </h2>
          <p className="text-muted-foreground">
            How we collect, use, and share information on the forums is
            described in our site{" "}
            <Link
              href="/legal/privacy"
              className="text-primary font-medium underline underline-offset-4"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold text-foreground">
            Updates to Policy
          </h2>
          <p className="text-muted-foreground">
            This content policy may be updated periodically. Continued use of
            the forums constitutes acceptance of the current policy.
          </p>
        </section>

        <section className="rounded-lg bg-secondary p-6">
          <h2 className="mb-4 text-2xl font-semibold text-foreground">
            Contact Us
          </h2>
          <p className="text-muted-foreground">
            To report a violation, including copyright or misuse of traditional
            craft knowledge, follow our{" "}
            <Link
              href="/legal/takedown"
              className="text-primary font-medium underline underline-offset-4"
            >
              Takedown Policy
            </Link>{" "}
            or email{" "}
            <a
              href="mailto:support@artisanalfutures.org"
              className="text-primary font-medium underline underline-offset-4"
            >
              support@artisanalfutures.org
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
