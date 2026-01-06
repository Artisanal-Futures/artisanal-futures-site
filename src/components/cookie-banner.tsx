/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "~/utils/styles";
import { CookieIcon } from "lucide-react";

import { Button } from "./ui/button";

export default function CookieConsent({
  demo = false,
  onAcceptCallback = () => void 0,
  // onDeclineCallback = () => void 0,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [hide, setHide] = useState(false);

  const accept = () => {
    setIsOpen(false);
    document.cookie =
      "cookieConsent=true; expires=Fri, 31 Dec 9999 23:59:59 GMT";
    setTimeout(() => {
      setHide(true);
    }, 700);
    onAcceptCallback();
  };

  // const decline = () => {
  //   setIsOpen(false);
  //   setTimeout(() => {
  //     setHide(true);
  //   }, 700);
  //   onDeclineCallback();
  // };

  useEffect(() => {
    try {
      setIsOpen(true);
      if (document.cookie.includes("cookieConsent=true")) {
        if (!demo) {
          setIsOpen(false);
          setTimeout(() => {
            setHide(true);
          }, 700);
        }
      }
    } catch (e) {
      // console.log("Error: ", e);
    }
  }, []);

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-[200] w-full transition-transform duration-700 sm:bottom-4 sm:left-4 sm:max-w-md",
        !isOpen
          ? "translate-y-8 opacity-0 transition-[opacity,transform]"
          : "translate-y-0 opacity-100 transition-[opacity,transform]",
        hide && "hidden",
      )}
    >
      <div className="m-2 rounded-md border bg-secondary shadow">
        <div className="grid gap-2">
          <div className="flex h-14 items-center justify-between border-b border-border p-4">
            <h1 className="text-lg font-medium">Cookie Notice</h1>
            <CookieIcon className="h-[1.2rem] w-[1.2rem]" />
          </div>
          <div className="p-4">
            <p className="text-sm font-normal">
              We only use cookies that are strictly necessary for the
              functionality and security of our website and app.{" "}
              <b>
                We do <u>not</u> use cookies for personal tracking, advertising,
                analytics, or any other non-essential purpose.
              </b>
              <br />
              <br />
              By clicking &quot;
              <span className="font-medium opacity-80">Accept</span>&quot;, you
              agree to the use of these necessary cookies.
              <br />
              <span className="text-xs">
                You can read our full cookie policy here:{" "}
                <Link
                  href="/legal/cookies"
                  className="underline"
                  target="_blank"
                >
                  Cookie Policy
                </Link>
                .
              </span>
            </p>
          </div>
          <div className="flex gap-2 border-t border-border bg-background/20 p-4 py-5">
            <Button onClick={accept} className="w-full">
              Accept
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
