import Link from 'next/link'

import { Button } from '~/components/ui/button'

export const metadata = {
  title: '404 Not Found',
}

export default function NotFoundPage() {
  const strippedSupportEmail = 'support@artisanalfutures.org'

  return (
    <div className="mx-auto flex h-full w-full max-w-7xl flex-grow flex-col items-stretch p-8">
      <div className="centered-page my-auto">
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-bold">404 Not Found</h1>
          <h2 className="mx-auto mb-4 max-w-4xl text-xl text-gray-600">
            It appears that this page does not exist. If you believe this is an
            this is an error, please contact us at{' '}
            <Link
              href={`mailto:${strippedSupportEmail}`}
              className="text-blue-500 underline"
            >
              {strippedSupportEmail}
            </Link>
          </h2>
          <Link href="/contact-us">
            <Button>Contact Us</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
