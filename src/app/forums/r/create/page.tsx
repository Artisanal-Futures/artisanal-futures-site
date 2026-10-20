import type { Metadata } from "next";
import { Suspense } from "react";

import { CreateCommunityWrapper } from "./_components/create-community-wrapper";

export const metadata: Metadata = {
  title: "Create Community",
  robots: { index: false, follow: false },
};

function CreateCommunityFallback() {
  return (
    <div className="container mx-auto flex h-full max-w-3xl items-center">
      <div className="text-muted-foreground w-full text-center text-sm">
        Loading...
      </div>
    </div>
  );
}

export default function CreateCommunityPage() {
  return (
    <Suspense fallback={<CreateCommunityFallback />}>
      <CreateCommunityWrapper />
    </Suspense>
  );
}
