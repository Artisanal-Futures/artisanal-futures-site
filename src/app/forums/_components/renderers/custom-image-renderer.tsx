"use client";

import Image from "next/image";

export const CustomImageRenderer = ({
  data,
}: {
  data: { file: { url: string } };
}) => {
  const src = data.file.url;

  return (
    <div className="relative min-h-[15rem] w-full">
      <Image alt="image" className="object-contain" fill src={src} />
    </div>
  );
};
