import { Suspense } from "react";
import { CreateCommunityWrapper } from "./_components/create-community-wrapper";

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
