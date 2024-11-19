import { NextResponse } from "next/server";

import { env } from "~/env";

export async function GET(request: Request) {
  const apiKey = env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing API Key", data: null },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");
  if (!address) {
    return NextResponse.json(
      { error: "Missing address parameter", data: null },
      { status: 400 },
    );
  }

  const url = "https://places.googleapis.com/v1/places:searchText";

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
      },
      body: JSON.stringify({
        textQuery: address,
        languageCode: "en",
      }),
    });

    console.log(address);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.places && data.places.length > 0) {
      const placeId = data.places[0].id;
      return NextResponse.json({ data: { placeId }, error: null });
    } else {
      return NextResponse.json(
        { error: "No matching place found", data: null },
        { status: 404 },
      );
    }
  } catch (error) {
    console.error("Error fetching place ID:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Unknown error", data: null },
      { status: 500 },
    );
  }
}
