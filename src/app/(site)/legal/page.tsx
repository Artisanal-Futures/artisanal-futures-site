export const metadata = {
  title: "Legal",
  description: "The legal information for Artisanal Futures",
};

export default function LegalPage() {
  return (
    <div className="mx-auto max-w-3xl py-8">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900">
          Legal Information
        </h1>
        <p className="text-lg text-gray-600">
          Important policies and agreements for the Artisanal Futures community
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <a
          href="/legal/terms-of-use"
          className="block rounded-lg border border-gray-200 bg-white p-6 transition-all hover:border-blue-500 hover:shadow-lg"
        >
          <h2 className="mb-2 text-xl font-semibold text-gray-900">
            Terms of Use
          </h2>
          <p className="text-gray-600">
            Our terms and conditions for using the platform
          </p>
        </a>

        <a
          href="/legal/privacy"
          className="block rounded-lg border border-gray-200 bg-white p-6 transition-all hover:border-blue-500 hover:shadow-lg"
        >
          <h2 className="mb-2 text-xl font-semibold text-gray-900">
            Privacy Policy
          </h2>
          <p className="text-gray-600">How we handle and protect your data</p>
        </a>

        <a
          href="/legal/collective-agreement"
          className="block rounded-lg border border-gray-200 bg-white p-6 transition-all hover:border-blue-500 hover:shadow-lg"
        >
          <h2 className="mb-2 text-xl font-semibold text-gray-900">
            Collective Agreement
          </h2>
          <p className="text-gray-600">
            Guidelines for our artisanal community
          </p>
        </a>

        <a
          href="/legal/help-center"
          className="block rounded-lg border border-gray-200 bg-white p-6 transition-all hover:border-blue-500 hover:shadow-lg"
        >
          <h2 className="mb-2 text-xl font-semibold text-gray-900">
            Help Center
          </h2>
          <p className="text-gray-600">
            Get support and find answers to common questions
          </p>
        </a>

        <a
          href="/legal/cookies"
          className="block rounded-lg border border-gray-200 bg-white p-6 transition-all hover:border-blue-500 hover:shadow-lg"
        >
          <h2 className="mb-2 text-xl font-semibold text-gray-900">
            Cookie Policy
          </h2>
          <p className="text-gray-600">Information about how we use cookies</p>
        </a>
      </div>
    </div>
  );
}
