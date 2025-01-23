export const metadata = {
  title: 'Artisanal Futures Forums Content Policy',
}

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
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold text-foreground">
            Data Privacy
          </h2>
          <p className="mb-4 text-muted-foreground">
            We take your privacy seriously. Here&apos;s our commitment to
            protecting your data:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
            <li>
              We do not sell or share your personal information with third
              parties
            </li>
            <li>
              We only collect information necessary for forum functionality
            </li>
            <li>
              Your data is used solely for operating and improving the forum
              experience
            </li>
            <li>We implement security measures to protect your information</li>
          </ul>
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
            guidelines may be removed, and repeated violations may result in
            account suspension or termination.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold text-foreground">
            Updates to Policy
          </h2>
          <p className="text-muted-foreground">
            This content policy may be updated periodically. Users will be
            notified of significant changes. Continued use of the forums
            constitutes acceptance of the current policy.
          </p>
        </section>

        <section className="rounded-lg bg-secondary p-6">
          <h2 className="mb-4 text-2xl font-semibold text-foreground">
            Contact Us
          </h2>
          <p className="text-muted-foreground">
            If you have questions about our content policy or need to report a
            violation, please contact our moderation team through the
            appropriate channels.
          </p>
        </section>
      </div>
    </div>
  )
}
