import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

import type { Product } from '~/app/(site)/products/_validators/types'

export async function GET(req: NextRequest) {
  const payloadForProducts = {
    query: {
      content: 'string',
    },
    response_model: [
      {
        name: 'string',
        description: 'string',
        principles: 'string',
        the_artisan: 'string',
        url: 'string',
        image:
          'https://cdn1.vectorstock.com/i/thumb-large/46/50/missing-picture-page-for-website-design-or-mobile-vector-27814650.jpg',
        craftID: 'string',
      },
    ],
  }

  try {
    const products = await axios.post(
      'https://data.artisanalfutures.org/api/v1/products/search/',
      payloadForProducts,
    )

    if (products.status !== 200) {
      return NextResponse.json(
        { error: 'Error fetching data' },
        { status: 500 },
      )
    }

    const data = products.data as Product[]
    const filteredProducts = [
      ...new Map(
        data
          .filter((product) => product.principles !== '')
          .map((item) => [item.craftID, item]),
      ).values(),
    ]

    return NextResponse.json(filteredProducts)
  } catch (error) {
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
