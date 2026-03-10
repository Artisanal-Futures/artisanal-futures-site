import Image from "next/image";
import Link from "next/link";

import { ContactForm } from "./_components/contact-form";

export default async function ContactPage() {
  return (
    <>
      <header className="site-header">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="tagline">Have a Question?</p>
            <h1>Contact Us</h1>
          </div>
          <p className="description">
            Want to know more about Artisanal Futures? Maybe you want to join
            us? We&apos;d love to hear from you. Send us a message and
            we&apos;ll respond as soon as possible. You can also check out our{" "}
            <Link
              href="/about-us"
              className="text-primary underline-offset-2 hover:underline"
            >
              About Us
            </Link>{" "}
            page for more information.
          </p>
        </div>
      </header>

      <section className="site-section">
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
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}

export const metadata = {
  title: "Contact Us",
};
