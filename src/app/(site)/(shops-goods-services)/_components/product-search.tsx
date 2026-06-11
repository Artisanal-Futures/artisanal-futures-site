"use client";

import { useState } from "react";

export function ProductSearch({ type }: { type: "products" | "services" }) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);

  const basePath =
    type === "products"
      ? "/collections/products/all-products"
      : "/collections/services/all-services";

  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (value.trim()) {
      setLoading(true);
      window.location.href = `${basePath}?search=${encodeURIComponent(
        value.trim(),
      )}`;
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto my-8 flex max-w-xl items-center gap-2"
      role="search"
    >
      <input
        type="text"
        className="focus:border-primary w-full rounded border border-slate-300 px-4 py-2 text-lg shadow-sm focus:outline-none"
        placeholder={`Search ${type} by name...`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-label={`Search ${type}`}
        disabled={loading}
      />
      <button
        type="submit"
        className="bg-primary hover:bg-primary/90 rounded px-4 py-2 text-white transition disabled:opacity-60"
        disabled={loading}
      >
        Search
      </button>
    </form>
  );
}
