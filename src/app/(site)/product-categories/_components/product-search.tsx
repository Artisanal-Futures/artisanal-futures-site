"use client";

import { useState } from "react";

export function ProductSearch() {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (value.trim()) {
      setLoading(true);
      window.location.href = `/product-categories/all-products?search=${encodeURIComponent(
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
        placeholder="Search all products..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-label="Search products"
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
