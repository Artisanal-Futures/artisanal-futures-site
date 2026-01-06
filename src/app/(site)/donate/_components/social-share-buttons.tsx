"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Facebook, Linkedin, Share2, Twitter } from "lucide-react";
import {
  FacebookShareButton,
  LinkedinShareButton,
  TwitterShareButton,
} from "react-share";

import { cn } from "~/lib/utils";
import { Button, buttonVariants } from "~/components/ui/button";

interface SocialShareButtonsProps {
  url?: string;
  title?: string;
  description?: string;
}

export function SocialShareButtons({
  url,
  title = "Donate to Artisanal Futures!",
  description = "Support Artisanal Futures - a platform for artisan communities and worker-owned businesses.",
}: SocialShareButtonsProps) {
  const [shareUrl, setShareUrl] = useState(url ?? "");
  const [hasNativeShare, setHasNativeShare] = useState(false);

  useEffect(() => {
    // Set the URL on client side
    if (!url && typeof window !== "undefined") {
      setShareUrl(window.location.href);
    }

    // Check for native share support
    if (
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function"
    ) {
      setHasNativeShare(true);
    }
  }, [url]);

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or error occurred
        console.log("Error sharing:", err);
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      alert("Link copied to clipboard!");
    }
  };

  const buttonClasses = cn(
    buttonVariants({ variant: "outline", size: "sm" }),
    "flex items-center gap-2",
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <div className={buttonClasses}>
          <FacebookShareButton
            url={`https://artisanalfutures.org/donate`}
            className={buttonClasses}
            title="Donate to Artisanal Futures!"
          >
            <Image
              src="/img/facebook.svg"
              alt="Facebook"
              width={16}
              height={16}
            />{" "}
            Facebook
          </FacebookShareButton>
        </div>
        <div className={buttonClasses}>
          <TwitterShareButton
            url={`https://artisanalfutures.org/donate`}
            title={title}
            className={buttonClasses}
          >
            <Image src="/img/x.svg" alt="X" width={16} height={16} /> X
          </TwitterShareButton>
        </div>
        <div className={buttonClasses}>
          <LinkedinShareButton
            url={`https://artisanalfutures.org/donate`}
            source={`https://artisanalfutures.org/donate`}
            title={title}
            summary={description}
            className={buttonClasses}
          >
            <Linkedin className="h-4 w-4" />
            LinkedIn
          </LinkedinShareButton>
        </div>
      </div>
    </div>
  );
}
