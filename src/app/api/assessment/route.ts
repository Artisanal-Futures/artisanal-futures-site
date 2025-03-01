import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import axios from "axios";

import type { FastAPIProduct } from "~/app/(site)/products/_validators/types";

// import data from "~/json/ecodata.json";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("keyword");

  const payloadForProducts = {
    query: {
      content: keyword!,
    },
    response_model: [
      {
        name: "",
        description: "",
        principles: "",
        the_artisan: "",
        url: "",
        image: "",
        craftID: "",
        assessment: [],
      },
    ],
  };

  try {
    const products = await axios.post(
      "https://data.artisanalfutures.org/api/v1/assessment/product-search-with-assessment/",
      payloadForProducts,
    );

    if (products.status !== 200) {
      return NextResponse.json(
        { error: "Error fetching data" },
        { status: 500 },
      );
    }

    const data = products.data as FastAPIProduct[];
    const filteredProducts = [
      ...new Map(
        data
          .filter((product) => product.principles !== "")
          .map((item) => [item.craftID, item]),
      ).values(),
    ];

    return NextResponse.json(filteredProducts);
  } catch (error) {
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
