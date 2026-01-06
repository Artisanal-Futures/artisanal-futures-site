export default function DonateSuccessPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-16">
      <svg
        className="mb-4 h-16 w-16 text-green-500"
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
          fill="#dcfce7"
        />
        <path
          d="M16 24l6 6 10-10"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      <h1 className="mb-2 text-2xl font-semibold text-gray-900">
        Thank you for your donation!
      </h1>
      <p className="mb-6 text-center text-gray-700">
        Your support makes a difference for artisan communities and worker-owned
        businesses.
      </p>
      <a
        href="/"
        className="rounded-md bg-green-600 px-6 py-2 text-white transition hover:bg-green-700"
      >
        Back to Home
      </a>
    </div>
  );
}
