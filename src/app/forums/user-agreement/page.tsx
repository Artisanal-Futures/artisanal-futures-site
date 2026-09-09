import Link from "next/link";

export const metadata = {
  title: "Artisanal Futures Forums User Agreement",
};

export default function UserAgreement() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold text-foreground">
        Artisanal Futures Forums User Agreement
      </h1>

      <div className="space-y-8">
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-foreground">
            The terms that apply
          </h2>
          <p className="text-muted-foreground">
            The community forum is part of the Artisanal Futures Services. By
            using the forums, you agree to our site{" "}
            <Link
              href="/legal/terms-of-use"
              className="text-primary font-medium underline underline-offset-4"
            >
              Terms of Use
            </Link>
            . That document is the binding agreement for the forums, including
            acceptable use, content standards, ownership of your posts, and
            account enforcement.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold text-foreground">
            Community guidelines
          </h2>
          <p className="text-muted-foreground">
            Additional community guidelines for discussion on the forums are in
            our{" "}
            <Link
              href="/forums/content-policy"
              className="text-primary font-medium underline underline-offset-4"
            >
              Content Policy
            </Link>{" "}
            and{" "}
            <Link
              href="/legal/help-center"
              className="text-primary font-medium underline underline-offset-4"
            >
              Help Center
            </Link>
            . Those are not a separate contract. If they ever differ from the
            Terms of Use, the Terms of Use control.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold text-foreground">
            Reporting problems
          </h2>
          <p className="text-muted-foreground">
            To ask us to remove content, follow our{" "}
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

        <section className="rounded-lg bg-secondary p-6">
          <h2 className="mb-4 text-2xl font-semibold text-foreground">
            Contact
          </h2>
          <p className="text-muted-foreground">
            Questions about this page can be sent to{" "}
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
