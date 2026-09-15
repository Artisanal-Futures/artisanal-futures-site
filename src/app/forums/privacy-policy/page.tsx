import Link from "next/link";

export const metadata = {
  title: "Artisanal Futures Forums Privacy Policy",
};

export default function PrivacyPolicy() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold text-foreground">
        Artisanal Futures Forums Privacy Policy
      </h1>

      <div className="space-y-8">
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-foreground">
            Overview
          </h2>
          <p className="text-muted-foreground">
            The community forum is part of Artisanal Futures. How we collect,
            use, share, and retain information — including forum posts,
            comments, votes, and related technical data — is described in our
            site{" "}
            <Link
              href="/legal/privacy"
              className="text-primary font-medium underline underline-offset-4"
            >
              Privacy Policy
            </Link>
            . That policy is the one that applies here.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold text-foreground">
            Cookies
          </h2>
          <p className="text-muted-foreground">
            Cookies on the forums are the same strictly necessary cookies
            described in our{" "}
            <Link
              href="/legal/cookies"
              className="text-primary font-medium underline underline-offset-4"
            >
              Cookie Policy
            </Link>
            . We do not use cookies for personal tracking, advertising, or
            analytics.
          </p>
        </section>

        <section className="rounded-lg bg-secondary p-6">
          <h2 className="mb-4 text-2xl font-semibold text-foreground">
            Contact
          </h2>
          <p className="text-muted-foreground">
            Questions about privacy, or requests to access, correct, or delete
            personal information, can be sent to{" "}
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
