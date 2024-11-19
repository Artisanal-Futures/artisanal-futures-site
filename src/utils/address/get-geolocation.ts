import { type NextRequest } from "next/server";
import { type CountryCode } from "libphonenumber-js";

export async function getGeolocation(request: NextRequest) {
  const ipCountry = request.headers.get(
    "x-vercel-ip-country",
  ) as CountryCode | null;

  await new Promise((resolve) => setTimeout(resolve, 200));
  return ipCountry;
}
