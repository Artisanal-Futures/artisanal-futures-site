"use client";

import Image from "next/image";

export default function DynamicImage() {
  return (
    <Image
      src="/placeholder.png"
      alt="Ubuntu AI placeholder"
      width={500}
      height={500}
    />
  );
}
