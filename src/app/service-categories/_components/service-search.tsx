"use client";

import { useState } from "react";

// SearchBar component (client component)
export function ServiceSearch() {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (value.trim()) {
      setLoading(true);
      window.location.href = `/service-category/all-services?search=${encodeURIComponent(
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
        className="w-full rounded border border-slate-300 px-4 py-2 text-lg shadow-sm focus:border-primary focus:outline-none"
        placeholder="Search all services..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-label="Search services"
        disabled={loading}
      />
      <button
        type="submit"
        className="rounded bg-primary px-4 py-2 text-white transition hover:bg-primary/90 disabled:opacity-60"
        disabled={loading}
      >
        Search
      </button>
    </form>
  );
}
