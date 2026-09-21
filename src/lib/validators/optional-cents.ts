import { z } from "zod";

/** Empty / missing values stay `null`. `0` stays `0`. */
function emptyToNull(val: unknown): unknown {
  if (val === null || val === undefined) return null;
  if (typeof val === "number" && Number.isNaN(val)) return null;
  if (typeof val === "string" && val.trim() === "") return null;
  return val;
}

const centsSchema = z
  .number()
  .int("Price must be a whole number of cents.")
  .min(0, "Price cannot be negative.")
  .max(100_000_000, "Price is too large.")
  .nullable();

export const optionalCents = z.preprocess((val) => {
  const emptied = emptyToNull(val);
  if (emptied === null) return null;
  if (typeof emptied === "number") return emptied;
  if (typeof emptied === "string") return Number(emptied);
  return emptied;
}, centsSchema);
