import Image from "next/image";

import type { User } from "@prisma/client";
import type { AvatarProps } from "@radix-ui/react-avatar";

import { env } from "~/env";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Icons } from "~/app/forums/_components/forum-icons";

interface Props extends AvatarProps {
  user: Pick<User, "image" | "name">;
}

export function UserAvatar({ user, ...props }: Props) {
  const isImageUrl = (url: string) => {
    return url.startsWith("http");
  };
  return (
    <Avatar {...props}>
      {user.image ? (
        <div className="relative aspect-square h-full w-full">
          <Image
            fill
            src={
              isImageUrl(user.image)
                ? user.image
                : `${env.NEXT_PUBLIC_STORAGE_URL}/shops/${user.image}`
            }
            alt="profile picture"
            referrerPolicy="no-referrer"
          />
        </div>
      ) : (
        <AvatarFallback>
          <span className="sr-only">{user?.name}</span>
          <Icons.user className="h-4 w-4" />
        </AvatarFallback>
      )}
    </Avatar>
  );
}
