export default function DonateCancelPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-16">
      <svg
        className="mb-4 h-16 w-16 text-blue-500"
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
          strokeWidth="2"
          fill="#dbeafe"
        />
        <path
          d="M18 24 L24 18 L30 24 M24 18 L24 30"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <h1 className="mb-2 text-2xl font-semibold text-gray-900">
        Payment Canceled
      </h1>
      <p className="mb-6 text-center text-gray-700">
        No worries! Your donation wasn&apos;t processed.
        <br />
        You can try again anytime.
      </p>
      <a
        href="/donate"
        className="rounded-md bg-blue-600 px-6 py-2 text-white transition hover:bg-blue-700"
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
