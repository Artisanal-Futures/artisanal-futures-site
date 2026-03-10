"use client";

import type { FC } from "react";
import { usePathname, useRouter } from "next/navigation";

import type { Session } from "~/server/better-auth/config";
import { Input } from "~/components/ui/input";

import { UserAvatar } from "./user-avatar";

type Props = {
  session: Session | null;
};

export const MiniCreatePost: FC<Props> = ({ session }) => {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <li className="bg-background overflow-hidden rounded-md shadow">
      <div className="flex h-full justify-between gap-6 px-6 py-4">
        <div className="relative">
          <UserAvatar
            user={{
              name: session?.user.name ?? null,
              image: session?.user.image ?? null,
            }}
          />

          <span className="absolute right-0 bottom-0 h-3 w-3 rounded-full bg-green-500 outline outline-2 outline-white" />
        </div>
        <Input
          onClick={() => router.push(pathname + "/submit")}
          readOnly
          placeholder="Create post"
        />
        {/* <Button
          onClick={() => router.push(pathname + "/submit")}
          variant="ghost"
        >
          <ImageIcon className="text-zinc-600" />
        </Button>
        <Button
          onClick={() => router.push(pathname + "/submit")}
          variant="ghost"
        >
          <Link2 className="text-zinc-600" />
        </Button> */}
      </div>
    </li>
  );
};
