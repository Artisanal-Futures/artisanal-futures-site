export const metadata = {
  title: 'Artisanal Futures Forums Privacy Policy',
}

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
            At Artisanal Futures Forums, we prioritize your privacy and are
            committed to protecting your personal information. This privacy
            policy explains how we handle data on our forums.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold text-foreground">
            Data Collection
          </h2>
          <p className="mb-4 text-muted-foreground">
            We collect minimal information required for basic forum
            functionality:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
            <li>Basic account information (username, email)</li>
            <li>Forum posts and comments you choose to make</li>
            <li>Technical information necessary for site operation</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold text-foreground">
            How We Use Your Data
          </h2>
          <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
            <li>To provide and maintain forum functionality</li>
            <li>To enable community participation and discussion</li>
            <li>To ensure forum security and prevent abuse</li>
            <li>To improve user experience</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold text-foreground">
            Data Protection
          </h2>
          <p className="text-muted-foreground">
            We implement security measures to protect your information and do
            not:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
            <li>Sell your personal information to third parties</li>
            <li>Share your data with advertisers</li>
            <li>Track your activity outside our forums</li>
            <li>Store unnecessary personal information</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold text-foreground">
            Your Rights
          </h2>
          <p className="text-muted-foreground">You have the right to:</p>
          <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
            <li>Access your personal data</li>
            <li>Request deletion of your account and data</li>
            <li>Export your forum contributions</li>
            <li>Update or correct your information</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold text-foreground">
            Cookies
          </h2>
          <p className="text-muted-foreground">
            We use essential cookies only for forum functionality and user
            sessions. No tracking or advertising cookies are used.
          </p>
        </section>

        <section className="rounded-lg bg-secondary p-6">
          <h2 className="mb-4 text-2xl font-semibold text-foreground">
            Contact Information
          </h2>
          <p className="text-muted-foreground">
            If you have questions about your privacy on Artisanal Futures Forums
            or need to exercise your data rights, please contact our privacy
            team through the appropriate support channels.
          </p>
        </section>
      </div>
    </div>
  )
}
