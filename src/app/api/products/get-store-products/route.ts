/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { NextResponse } from "next/server";
import axios from "axios";

import type { FastAPIProduct } from "~/app/(site)/products/_validators/types";

const payloadForProducts = {
  query: {
    content: "string",
  },
  response_model: [
    {
      name: "string",
      description: "string",
      principles: "string",
      the_artisan: "string",
      url: "string",
      image:
        "https://cdn1.vectorstock.com/i/thumb-large/46/50/missing-picture-page-for-website-design-or-mobile-vector-27814650.jpg",
      craftID: "string",
    },
  ],
};

export async function POST(request: Request) {
  const { storeName } = await request.json();

  console.log("storeName", storeName);

  const products = await axios.post(
    "https://data.artisanalfutures.org/api/v1/products/search/",
    payloadForProducts,
  );

  if (products.status !== 200) {
    return NextResponse.json({ error: "Error fetching data" }, { status: 500 });
  }

  const data = products.data as FastAPIProduct[];
  const filteredProducts = [
    ...new Map(
      data
        .filter((product) => product.principles !== "")
        .filter(
          (product) =>
            product.the_artisan.toLowerCase() ===
            (storeName as string).toLowerCase(),
        )
        .map((item) => [item.craftID, item]),
    ).values(),
  ];

  return NextResponse.json(filteredProducts);
}
