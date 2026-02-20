"use client";

import dynamic from "next/dynamic";

const CreateCommunityClient = dynamic(
  () => import("./create-community-client"),
  { ssr: false }
);

export function CreateCommunityWrapper() {
  return <CreateCommunityClient />;
}
