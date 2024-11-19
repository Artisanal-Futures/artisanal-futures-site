import Image from "next/image";

type Props = {
  name: string;
  image?: string;
};

export const RowImageSpan = ({ name, image }: Props) => {
  return (
    <div className="group flex w-full items-center gap-2">
      <div className="relative aspect-square h-10 rounded-lg border border-border shadow-sm">
        <Image
          src={image ?? "/placeholder-image.webp"}
          fill
          className="rounded-lg"
          alt=""
        />
      </div>
      <span className="px-1 text-sm text-gray-500">{name}</span>
    </div>
  );
};
