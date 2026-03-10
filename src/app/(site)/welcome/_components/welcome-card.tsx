"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ExternalLink, Sparkles } from "lucide-react";

const UPCY_URL = "https://generate.dev.artisanalfutures.org/";

export interface WelcomeCardUser {
  name: string | null;
  email: string | null;
  avatar: string | null;
}

function getDisplayName(user: WelcomeCardUser): string {
  if (user.name?.trim()) {
    const firstName = user.name.trim().split(/\s+/)[0];
    if (firstName) return firstName;
  }
  if (user.email) {
    const local = user.email.split("@")[0];
    if (local) return local;
  }
  return "there";
}

function getInitials(user: WelcomeCardUser): string {
  if (user.name?.trim()) {
    const parts = user.name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
    }
    if (parts[0]) return parts[0].slice(0, 2).toUpperCase();
  }
  if (user.email) {
    const local = user.email.split("@")[0];
    if (local) return local.slice(0, 2).toUpperCase();
  }
  return "?";
}

export interface WelcomeCardProps {
  user: WelcomeCardUser;
}

export function WelcomeCard({ user }: WelcomeCardProps) {
  const displayName = getDisplayName(user);
  const initials = getInitials(user);

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-12">
          <div className="mb-6 flex items-center gap-4">
            {user.avatar ? (
              <div className="border-secondary relative size-16 overflow-hidden rounded-full border-2 shadow-sm">
                <Image
                  src={user.avatar}
                  alt={user.name ?? ""}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="border-secondary bg-muted flex size-16 items-center justify-center rounded-full border-2">
                <span className="text-muted-foreground text-xl font-semibold">
                  {initials}
                </span>
              </div>
            )}

            <div>
              <h1 className="text-foreground text-2xl font-bold sm:text-3xl">
                Welcome, {displayName}
              </h1>
              <p className="text-muted-foreground">Guest</p>
            </div>
          </div>
          <p className="text-foreground/80 max-w-3xl leading-relaxed">
            We are excited to have you on board! As a guest we are giving you
            access to some of our platform tools. Feel free to explore and
            experiment! We would love to hear your feedback and suggestions to
            improve the tools. Either email us directly or reach out on our{" "}
            <Link
              href="/contact"
              className="text-primary font-medium underline underline-offset-4 hover:no-underline"
            >
              Contact Page →
            </Link>
          </p>
        </header>

        {/* Platform Tools */}
        <section className="mb-12">
          <h2 className="text-foreground mb-6 text-lg font-semibold">
            Platform Tools
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <a
              href={UPCY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group border-border bg-card hover:border-ring/30 flex flex-col gap-4 rounded-xl border p-6 transition-all hover:shadow-md"
            >
              <div className="bg-secondary flex size-11 items-center justify-center rounded-lg">
                <Sparkles className="text-foreground size-5" />
              </div>
              <div>
                <h3 className="text-foreground group-hover:text-primary flex items-center gap-2 font-semibold transition-colors">
                  UPCY
                  <ExternalLink className="text-muted-foreground size-3.5" />
                </h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  Discover upcycling resources, sustainable materials, and
                  eco-friendly practices.
                </p>
              </div>
              <span className="text-primary mt-auto inline-flex items-center text-sm font-medium">
                Explore UPCY
                <ArrowRight className="ml-1.5 size-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
