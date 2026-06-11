import { redirect } from "next/navigation";

import { UPCY_URL } from "~/data/tools";
import { getSession } from "~/server/better-auth/server";

export default async function UpcyPage() {
  const session = await getSession();

  // UPCY is not open to the public — only signed-in users may access it.
  if (!session) {
    redirect("/auth/sign-in?callbackUrl=/tools/upcy");
  }

  redirect(UPCY_URL);
}
