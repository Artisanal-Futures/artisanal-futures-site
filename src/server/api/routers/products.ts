import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import axios from "axios";
import { z } from "zod";

import { TRPCError } from "@trpc/server";

import type { Artisan, Attribute } from "~/types";
import { type FastAPIProduct } from "~/app/(site)/products/_validators/types";

const PRODUCT_ENDPOINT =
  "https://data.artisanalfutures.org/api/v1/products/search/";

export const productsRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),

  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.db.example.findMany();
  }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),

  getAllProducts: publicProcedure.query(async () => {
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

    const response = await axios.post(PRODUCT_ENDPOINT, payloadForProducts);

    if (response.status != 200) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Failed to fetch products",
      });
    }

    const data = (await response.data) as FastAPIProduct[];

    const filteredProducts = [
      ...new Map(
        data
          .filter((product) => product.principles !== "")
          .map((item) => [item.craftID, item]),
      ).values(),
    ];

    const formattedProducts: FastAPIProduct[] = filteredProducts
      .map((product: FastAPIProduct, key: number) => {
        return {
          ...product,
          the_artisan: product.the_artisan.toLowerCase(),
          principles: product.principles.toLowerCase(),
          id: key,
        };
      })
      .sort((a, b) => (a.craftID > b.craftID ? 1 : -1));
    const formattedArtisans: Artisan[] = Array.from(
      new Set(
        data.map((product: FastAPIProduct) =>
          product.the_artisan.toLowerCase(),
        ),
      ),
    );
    const formattedAttributes: Attribute[] = Array.from(
      new Set(
        data
          .flatMap((product: FastAPIProduct) =>
            product.principles.toLowerCase().split(","),
          )
          .filter((attribute: string) => attribute.trim() !== ""),
      ),
    );
    return {
      products: formattedProducts,
      artisans: formattedArtisans,
      attributes: formattedAttributes,
    };
  }),
});
