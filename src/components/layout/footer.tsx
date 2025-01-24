import Image from "next/image";
import Link from "next/link";

export const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="w-full bg-muted p-6 md:py-12">
      <div className="container grid max-w-7xl grid-cols-2 gap-8 text-sm sm:grid-cols-3 md:grid-cols-5">
        <div className="grid gap-1 md:col-span-2">
          <Link href="#" className="flex items-center gap-2" prefetch={false}>
            <Image
              src="/logo-ui.png"
              alt="Ubuntu-AI"
              width={32}
              height={32}
              className="rounded-md"
            />
            <span className="font-semibold">Ubuntu-AI © {year}</span>
          </Link>
          <p className="text-muted-foreground">Empowering the future of AI.</p>
        </div>

        <div className="grid gap-1 md:col-start-3">
          <h3 className="font-semibold">Navigation</h3>
          <Link href="/" className="hover:underline" prefetch={false}>
            Home
          </Link>
          <Link href="/about" className="hover:underline" prefetch={false}>
            About
          </Link>

          <Link href="/contact-us" className="hover:underline" prefetch={false}>
            Contact Us
          </Link>
        </div>
        <div className="grid gap-1">
          <h3 className="font-semibold">Resources</h3>
          <Link
            href="/contributors-guide"
            className="hover:underline"
            prefetch={false}
          >
            Contributor&apos;s Guide
          </Link>
          <Link
            href="/create-project"
            className="hover:underline"
            prefetch={false}
          >
            Create Project
          </Link>
        </div>
        <div className="grid gap-1">
          <h3 className="font-semibold">Legal</h3>
          <Link
            href="/privacy-policy"
            className="hover:underline"
            prefetch={false}
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms-of-service"
            className="hover:underline"
            prefetch={false}
          >
            PM Contract
          </Link>
        </div>
      </div>
    </footer>
  );
};
