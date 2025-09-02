export const metadata = {
  title: 'Artisanal Futures Forums User Agreement',
}

export default function UserAgreement() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold text-foreground">
        Artisanal Futures Forums User Agreement
      </h1>

      <div className="space-y-8">
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-foreground">
            1. Your Agreement
          </h2>
          <p className="text-muted-foreground">
            By using Artisanal Futures Forums, you agree to be bound by this
            User Agreement. This is a legally binding agreement between you and
            Artisanal Futures Forums governing your access to and use of the
            forums, including any associated services.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold text-foreground">
            2. Forum Access
          </h2>
          <p className="mb-4 text-muted-foreground">
            To access certain features of the forums, you may need to create an
            account. You agree to:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
            <li>
              Provide accurate and complete information when creating your
              account
            </li>
            <li>Maintain the security of your account credentials</li>
            <li>
              Accept responsibility for all activities that occur under your
              account
            </li>
            <li>
              Notify us immediately of any unauthorized use of your account
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold text-foreground">
            3. Acceptable Use
          </h2>
          <p className="mb-4 text-muted-foreground">
            When using Artisanal Futures Forums, you agree not to:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
            <li>Violate any applicable laws or regulations</li>
            <li>Post content that infringes on intellectual property rights</li>
            <li>Share malicious software or harmful content</li>
            <li>Harass, bully, or intimidate other users</li>
            <li>Impersonate others or misrepresent your affiliation</li>
            <li>
              Attempt to gain unauthorized access to the forums or other
              accounts
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold text-foreground">
            4. Content Rights
          </h2>
          <p className="text-muted-foreground">
            You retain ownership of any content you post on Artisanal Futures
            Forums. However, by posting content, you grant us a worldwide,
            non-exclusive, royalty-free license to use, copy, modify, publish,
            and distribute your content in connection with the service.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold text-foreground">
            5. Moderation
          </h2>
          <p className="text-muted-foreground">
            We reserve the right to remove content and suspend or terminate
            accounts that violate this agreement. Moderators may take action to
            maintain the quality and safety of discussions, including but not
            limited to removing posts, limiting posting privileges, or banning
            users.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold text-foreground">
            6. Termination
          </h2>
          <p className="text-muted-foreground">
            We may suspend or terminate your access to the forums at any time
            for violations of this agreement or for any other reason we deem
            appropriate. You may also terminate your account at any time by
            following the appropriate procedures.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold text-foreground">
            7. Changes to Agreement
          </h2>
          <p className="text-muted-foreground">
            We may modify this agreement at any time. We will notify users of
            significant changes. Your continued use of the forums after changes
            constitutes acceptance of the modified agreement.
          </p>
        </section>

        <section className="rounded-lg bg-secondary p-6">
          <h2 className="mb-4 text-2xl font-semibold text-foreground">
            Contact
          </h2>
          <p className="text-muted-foreground">
            If you have questions about this User Agreement, please contact our
            support team through the appropriate channels. This agreement was
            last updated on January 1, 2025.
          </p>
        </section>
      </div>
    </div>
  )
}
