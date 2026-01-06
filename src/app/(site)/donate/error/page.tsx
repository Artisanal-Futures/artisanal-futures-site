export default function DonateErrorPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-16">
      <svg
        className="mb-4 h-16 w-16 text-red-500"
        fill="none"
        viewBox="0 0 48 48"
        stroke="currentColor"
        aria-hidden="true"
      >
        <circle
          cx="24"
          cy="24"
          r="22"
          stroke="currentColor"
          strokeWidth="4"
          fill="#fee2e2"
        />
        <line
          x1="18"
          y1="18"
          x2="30"
          y2="30"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <line
          x1="30"
          y1="18"
          x2="18"
          y2="30"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
      <h1 className="mb-2 text-2xl font-semibold text-gray-900">
        Oops! Your donation could not be processed.
      </h1>
      <p className="mb-6 text-center text-gray-700">
        There was an error processing your donation with Stripe.
        <br />
        Please try again or contact us if the issue persists.
      </p>
      <a
        href="/donate"
        className="rounded-md bg-red-600 px-6 py-2 text-white transition hover:bg-red-700"
      >
        Try Again
      </a>
      <a
        href="/"
        className="mt-3 text-sm text-gray-600 underline underline-offset-2 hover:text-gray-900"
      >
        Back to Home
      </a>
    </div>
  );
}
