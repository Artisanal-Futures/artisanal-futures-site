import Link from "next/link";

import { env } from "~/env";

export function AdminFooter() {
  const supportEmail = env.NEXT_PUBLIC_SUPPORT_EMAIL.match(/<(.+)>/)?.[1];
  return (
    <div className="z-20 w-full bg-background/95 shadow backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-4 flex h-14 items-center md:mx-8">
        <p className="text-left text-xs leading-loose text-muted-foreground md:text-sm">
          Need help? Let us know at{" "}
          <Link
            href={`mailto:${supportEmail}`}
            className="font-medium underline underline-offset-4"
          >
            {supportEmail}
          </Link>
        </p>
      </div>
    </div>
  );
}
