import Image from "next/image";

import { DefaultContactForm } from "./_components/contact-form";

export default async function ContactPage() {
  return (
    <>
      <header className="mx-auto max-w-7xl px-4 pt-12 pb-6 sm:px-6 sm:pt-16 sm:pb-8 lg:px-8">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-muted-foreground text-sm font-medium tracking-widest uppercase">
              Have a Question?
            </p>
            <h1 className="text-foreground text-3xl font-bold tracking-tight text-balance sm:text-4xl lg:text-5xl">
              Contact Us
            </h1>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="mb-8 text-gray-600">
          Have a question? We&apos;d love to hear from you. Send us a message
          and we&apos;ll respond as soon as possible.
        </p>
        <div className="grid min-h-[560px] grid-cols-1 overflow-hidden rounded-lg shadow-xl lg:grid-cols-3">
          <div className="relative flex flex-col items-center justify-end lg:col-span-1 lg:justify-center">
            <div className="relative h-full w-full">
              <Image
                src={"/placeholder.svg"}
                alt=""
                fill
                className="object-cover object-bottom"
                sizes="100vw"
                priority
              />
            </div>
          </div>

          <div className="flex flex-col bg-[#f5f5f5] p-8 lg:col-span-2 lg:justify-center lg:p-12">
            <DefaultContactForm />
          </div>
        </div>
      </div>
    </>
  );
}
