import { NextRequest, NextResponse } from "next/server";

import { env } from "~/env";
import { getGeolocation } from "~/utils/address/get-geolocation";

export async function GET(request: NextRequest) {
  const apiKey = env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing API Key", data: null },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);
  const country = await getGeolocation(request);
  const input = searchParams.get("input");
  const url = "https://places.googleapis.com/v1/places:autocomplete";

  const primaryTypes = [
    "street_address",
    "subpremise",
    "route",
    "street_number",
    "landmark",
  ];

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
      },
      body: JSON.stringify({
        input: input,
        includedPrimaryTypes: primaryTypes,
        includedRegionCodes: [country ?? "US"],
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({ data: data.suggestions, error: null });
  } catch (error) {
    console.error("Error fetching autocomplete suggestions:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Unknown error", data: null },
      { status: 500 },
    );
  }
}
