import type { FC } from "react";
import React from "react";
import Image from "next/image";
import { cn } from "~/utils/styles";
import { Calendar, MapPin } from "lucide-react";

import type { Shop } from "~/types/shop";
import { env } from "~/env";

import { ProfileContactBar } from "./profile-contact-bar";

type IProps = Partial<Shop> & React.HTMLAttributes<HTMLDivElement>;

const ProfileCard: FC<IProps> = ({
  name,
  ownerName,
  bio,
  className,
  logoPhoto,
  ownerPhoto,
  email,
  website,
  phone,
  address,
  createdAt,
}) => {
  return (
    <div
      className={cn(
        "flex w-full flex-col-reverse items-center gap-8 rounded-xl bg-white p-6 shadow-lg lg:w-10/12 lg:flex-row",
        className,
      )}
    >
      <div className="flex w-full flex-col gap-y-6 lg:w-8/12">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            {logoPhoto && (
              <div className="flex-shrink-0">
                <Image
                  width={64}
                  height={64}
                  src={`${env.NEXT_PUBLIC_STORAGE_URL}/shops/${logoPhoto}`}
                  alt="Shop logo"
                  className="h-16 w-16 rounded-xl bg-white object-cover shadow-sm"
                  blurDataURL={`${env.NEXT_PUBLIC_STORAGE_URL}/shops/${logoPhoto}`}
                  placeholder="blur"
                />
              </div>
            )}
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-gray-900">
                {ownerName}
              </h1>
              <h2 className="mt-1 text-2xl font-medium text-primary">{name}</h2>
            </div>
          </div>

          <div className="flex gap-4 text-sm text-muted-foreground">
            {address?.city && address?.state && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>
                  {address?.city}, {address?.state}
                </span>
              </div>
            )}
            {createdAt && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Joined {new Date(createdAt).getFullYear()}</span>
              </div>
            )}
          </div>

          <div className="prose max-w-none">
            <p className="text-gray-600">{bio}</p>
          </div>
        </div>

        <div className="border-t pt-6">
          <ProfileContactBar email={email} website={website} phone={phone} />
        </div>
      </div>

      <div className="relative w-full lg:w-4/12">
        {ownerPhoto && (
          <Image
            width={400}
            height={500}
            src={`${env.NEXT_PUBLIC_STORAGE_URL}/shops/${ownerPhoto}`}
            alt="Artisan profile photo"
            className="aspect-[3/4] w-full rounded-xl object-cover shadow-md transition-transform duration-300 hover:scale-[1.02]"
            priority
            blurDataURL={`${env.NEXT_PUBLIC_STORAGE_URL}/shops/${ownerPhoto}`}
            placeholder="blur"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        )}
        {!ownerPhoto && !logoPhoto && (
          <Image
            width={400}
            height={500}
            src={`${env.NEXT_PUBLIC_STORAGE_URL}/shops/placeholder-image.webp`}
            alt="Placeholder image"
            className="aspect-[3/4] w-full rounded-xl object-cover shadow-md"
            priority
            blurDataURL={`${env.NEXT_PUBLIC_STORAGE_URL}/shops/placeholder-image.webp`}
            placeholder="blur"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        )}
      </div>
    </div>
  );
};

export default ProfileCard;
