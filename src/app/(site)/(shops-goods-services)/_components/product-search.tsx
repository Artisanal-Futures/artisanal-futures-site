"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon } from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "~/components/ui/input-group";
import { Spinner } from "~/components/ui/spinner";

export function ProductSearch({
  type,
  /**
   * Where to send the query. Defaults to the catalog-wide listing, but the
   * results pages pass their own path so searching from inside a category
   * stays in that category instead of silently dropping the user into
   * "all-products".
   */
  basePath,
}: {
  type: "products" | "services";
  basePath?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [isPending, startTransition] = useTransition();

  const target =
    basePath ??
    (type === "products"
      ? "/collections/products/all-products"
      : "/collections/services/all-services");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const query = value.trim();
    if (!query) return;

    // A client navigation, not `window.location.href` — the old full document
    // reload also meant the loading flag never reset, because the page unloaded.
    startTransition(() => {
      router.push(`${target}?search=${encodeURIComponent(query)}`);
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto my-8 flex max-w-xl items-center gap-2"
      role="search"
    >
      <InputGroup className="flex-1">
        <InputGroupAddon>
          <SearchIcon className="size-4" />
        </InputGroupAddon>
        <InputGroupInput
          type="search"
          placeholder={`Search ${type} by name, tag, or shop…`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-label={`Search ${type}`}
        />
      </InputGroup>
      <Button type="submit" disabled={isPending || !value.trim()}>
        {isPending && <Spinner />}
        Search
      </Button>
    </form>
  );
}
