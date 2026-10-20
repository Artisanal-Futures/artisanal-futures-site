import Image from "next/image";
import Link from "next/link";

export const Hero = () => {
  return (
    <div className="bg-background relative mt-10 overflow-hidden">
      <div className="mx-auto max-w-7xl">
        <div className="bg-background relative z-10 border border-transparent pb-8 lg:w-full lg:max-w-2xl">
          <svg
            className="text-background absolute top-0 right-0 bottom-0 hidden h-full w-48 translate-x-1/2 transform lg:block"
            fill="currentColor"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <polygon points="50,0 100,0 50,100 0,100" />
          </svg>
          <div className="mx-auto my-6 max-w-7xl items-center px-4 sm:px-6 md:my-8 lg:mt-20 lg:px-8 xl:mt-28">
            <div className="flex w-full flex-col items-center justify-center text-center lg:justify-start">
              <h1 className="text-foreground text-5xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
                Artisanal Futures
              </h1>
              <p className="text-muted-foreground mx-auto mt-3 text-lg sm:mt-5 sm:max-w-xl md:mt-5 md:text-xl lg:mx-0">
                Shop worker-owned stores, share knowledge and tech, &
                participate in the transition to a decolonized circular economy.
              </p>
              <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                <Link
                  className="bg-primary/10 text-primary hover:bg-primary/20 focus:bg-primary/30 rounded-md px-3 py-2 font-semibold transition-all"
                  href={"/shops"}
                >
                  Browse Our Artisans
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>{" "}
      <div className="block border border-solid border-transparent lg:absolute lg:top-0 lg:right-0 lg:bottom-0 lg:w-1/2">
        <div className="max-lg:aspect-[1.628]">
          <Image
            width={200}
            height={160}
            src="/img/montage1.webp"
            id="fade-pic5"
            alt="An artisan in a striking red and silver bodysuit with white fringe and a shoulder-piece, arms outstretched, posing in an urban plaza"
            className="fade-pic absolute aspect-auto h-full w-full object-center max-lg:object-cover"
            priority={true}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <Image
            width={200}
            height={160}
            src="/img/montage2.webp"
            id="fade-pic4"
            alt="A maker leaning over a laser engraver as it etches a colorful kente-inspired pattern onto a wooden panel"
            className="fade-pic absolute aspect-auto h-full w-full object-center max-lg:object-cover"
            placeholder="blur"
            blurDataURL={"/img/montage2.webp"}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <Image
            width={200}
            height={160}
            src="/img/montage3.webp"
            id="fade-pic3"
            alt="An artisan in a black beanie and gray hoodie loading trays of fresh green herbs into a stainless-steel dehydrator rack"
            className="fade-pic absolute aspect-auto h-full w-full object-center max-lg:object-cover"
            placeholder="blur"
            blurDataURL={"/img/montage3.webp"}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <Image
            width={200}
            height={160}
            src="/img/montage4.webp"
            id="fade-pic2"
            alt="An elder in an orange head wrap and black sweater sorting fresh green herbs into a bowl at home"
            className="fade-pic absolute aspect-auto h-full w-full object-center max-lg:object-cover"
            placeholder="blur"
            blurDataURL={"/img/montage4.webp"}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <Image
            width={200}
            height={160}
            src="/img/montage5.webp"
            id="fade-pic1"
            alt="A smiling artisan in a purple shirt holding up a laser-cut gold pendant with a circular pattern, with textiles and mannequins behind her"
            className="fade-pic absolute aspect-auto h-full w-full object-center max-lg:object-cover"
            placeholder="blur"
            blurDataURL={"/img/montage5.webp"}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      </div>
    </div>
  );
};
