import {
  createTRPCRouter,
  elevatedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { z } from "zod";
import { type PrismaClient, type Prisma } from "@prisma/client";

const productSchema = z.object({
  name: z.string(),
  description: z.string(),
  priceInCents: z.number().optional().nullable(),
  currency: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  productUrl: z.string().optional().nullable(),
  tags: z.array(z.string()),
  attributeTags: z.array(z.string()),
  materialTags: z.array(z.string()),
  environmentalTags: z.array(z.string()),
  aiGeneratedTags: z.array(z.string()),
  scrapeMethod: z
    .enum(["MANUAL", "WORDPRESS", "SHOPIFY", "SQUARESPACE"])
    .default("MANUAL"),
  shopId: z.string(),
  shopProductId: z.string().optional().nullable(),
  categoryIds: z.array(z.string()).optional(),
});

// Type for products with potential imageUrl field
type ProductWithImage = {
  imageUrl?: string | null;
  [key: string]: unknown;
} | null;

const addFullImageUrl = <T extends ProductWithImage>(product: T): T => {
  if (!product) return product;
  const storageBaseUrl = "https://storage.artisanalfutures.org/products";
  if (product.imageUrl && !product.imageUrl.startsWith("http")) {
    return { ...product, imageUrl: `${storageBaseUrl}/${product.imageUrl}` };
  }
  return product;
};

const getCategoriesWithParents = async (
  db: PrismaClient,
  categoryIds: string[] | undefined,
): Promise<string[]> => {
  if (!categoryIds || categoryIds.length === 0) {
    return [];
  }

  const selectedCategories = await db.category.findMany({
    where: { id: { in: categoryIds } },
    select: { parentId: true },
  });

  const parentIds = selectedCategories
    .map((cat) => cat.parentId)
    .filter((id): id is string => id !== null);

  return [...new Set([...categoryIds, ...parentIds])];
};

export const productRouter = createTRPCRouter({
  updateTags: elevatedProcedure
    .input(
      z.object({
        productIds: z.array(z.string()),
        tagType: z.enum([
          "attributeTags",
          "materialTags",
          "environmentalTags",
          "aiGeneratedTags",
        ]),
        tags: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { productIds, tagType, tags } = input;
      const updatedProducts = await Promise.all(
        productIds.map(async (id) => {
          return ctx.db.product.update({
            where: { id },
            data: { [tagType]: tags },
          });
        }),
      );
      return {
        data: updatedProducts.map(addFullImageUrl),
        message: `${updatedProducts.length} products updated successfully`,
      };
    }),

  getAll: elevatedProcedure.query(async ({ ctx }) => {
    const products = await ctx.db.product.findMany({
      include: { shop: true, categories: true },
      orderBy: { createdAt: "desc" },
    });

    const productsWithFullUrls = products.map(addFullImageUrl);

    if (ctx.session.user.role !== "ADMIN") {
      return productsWithFullUrls.filter(
        (product) => product.shop?.ownerId === ctx.session.user.id,
      );
    }

    return productsWithFullUrls;
  }),

  getAllValid: publicProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(20),
      }).optional(),
    )
    .query(async ({ ctx, input }) => {
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 20;
      const skip = (page - 1) * limit;
      const [products, totalCount] = await Promise.all([
        ctx.db.product.findMany({
          include: { shop: true, categories: true },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        ctx.db.product.count(),
      ]);

      return {
        products: products.map(addFullImageUrl),
        totalCount,
        page,
        totalPages: Math.ceil(totalCount / limit),
      };
    }),

  getById: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const product = await ctx.db.product.findUnique({
      where: { id: input },
      include: { shop: true, categories: true },
    });
    return addFullImageUrl(product);
  }),

  getByShopId: publicProcedure
    .input(
      z.object({
        shopId: z.string(),
        page: z.number().default(1),
        limit: z.number().default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { shopId, page, limit } = input;
      const skip = (page - 1) * limit;

      const [products, totalCount] = await Promise.all([
        ctx.db.product.findMany({
          where: { shopId },
          include: { shop: true, categories: true },
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
        ctx.db.product.count({ where: { shopId } }),
      ]);

      return {
        products: products.map(addFullImageUrl),
        totalCount,
        page,
        totalPages: Math.ceil(totalCount / limit),
      };
    }),

  create: elevatedProcedure
    .input(productSchema)
    .mutation(async ({ ctx, input }) => {
      const { categoryIds, ...productData } = input;
      
      const allCategoryIds = await getCategoriesWithParents(ctx.db, categoryIds);

      const product = await ctx.db.product.create({
        data: {
          ...productData,
          categories: {
            connect: allCategoryIds.map((id) => ({ id })),
          },
        },
      });
      return { data: addFullImageUrl(product), message: "Product created successfully" };
    }),

  update: elevatedProcedure
    .input(productSchema.extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id, categoryIds, ...productData } = input;
      
      const allCategoryIds = await getCategoriesWithParents(ctx.db, categoryIds);

      const product = await ctx.db.product.update({
        where: { id },
        data: {
          ...productData,
          categories: {
            set: allCategoryIds.map((id) => ({ id })),
          },
        },
      });
      return { data: addFullImageUrl(product), message: "Product updated successfully" };
    }),

  delete: elevatedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const product = await ctx.db.product.delete({
        where: { id: input },
      });
      return { data: addFullImageUrl(product), message: "Product deleted successfully" };
    }),

  importProducts: publicProcedure
    .input(z.array(productSchema.extend({ shopProductId: z.string() })))
    .mutation(async ({ ctx, input }) => {
      const products = await Promise.all(
        input.map(async (product) => {
          const existingProduct = await ctx.db.product.findFirst({
            where: {
              shopId: product.shopId,
              shopProductId: product.shopProductId,
            },
          });

          if (existingProduct) {
            return ctx.db.product.update({
              where: { id: existingProduct.id },
              data: product,
            });
          }

          return ctx.db.product.create({
            data: product,
          });
        }),
      );

      return {
        data: products.map(addFullImageUrl),
        message: "Products imported successfully",
      };
    }),

  getAllByCategory: publicProcedure
    .input(
      z.object({
        categoryName: z.string(), 
        subcategoryName: z.string().optional(), 
        storeId: z.string().optional(),
        attributes: z.array(z.string()).optional(),
        sort: z.enum(["asc", "desc"]).default("asc"),
        search: z.string().optional(),
        page: z.number().default(1),
        limit: z.number().default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { 
        categoryName, subcategoryName, storeId, attributes, 
        sort, search, page, limit 
      } = input;
      const skip = (page - 1) * limit;

      const parentCategory = await ctx.db.category.findFirst({
        where: { name: { equals: categoryName, mode: "insensitive" } },
        include: { children: true },
      });

      if (!parentCategory) {
        return { products: [], totalCount: 0, totalPages: 0, subcategories: [] };
      }

      let categoryIdsToFilter: string[] = [parentCategory.id];
      if (subcategoryName) {
        const subcategory = parentCategory.children.find(
          (child) => child.name.toLowerCase() === subcategoryName.toLowerCase()
        );
        if (subcategory) {
          categoryIdsToFilter = [subcategory.id];
        } else {
          return { products: [], totalCount: 0, totalPages: 0, subcategories: parentCategory.children };
        }
      } else {
        categoryIdsToFilter.push(...parentCategory.children.map(c => c.id));
      }

      const where: Prisma.ProductWhereInput = {
        categories: { some: { id: { in: categoryIdsToFilter } } },
        isPublic: true,
      };

      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ];
      }
      if (storeId && storeId !== "all") {
        where.shopId = storeId;
      }
      if (attributes && attributes.length > 0) {
        where.shop = {
          attributeTags: { hasEvery: attributes },
        };
      }

      const [products, totalCount] = await ctx.db.$transaction([
        ctx.db.product.findMany({
          where,
          include: { shop: true, categories: true },
          orderBy: { name: sort },
          skip,
          take: limit,
        }),
        ctx.db.product.count({ where }),
      ]);

      return {
        products: products.map(addFullImageUrl),
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        subcategories: parentCategory.children,
      };
    }),

  bulkUpdate: elevatedProcedure
  .input(
    z.object({
      productIds: z.array(z.string()).min(1, "Please select at least one product."),
      categoryIds: z.array(z.string()).optional(),
      tags: z.array(z.string()).optional(),
      isPublic: z.boolean().optional(),
      shopId: z.string().optional(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { productIds, categoryIds, tags, isPublic, shopId } = input;

    // Filter only existing product IDs
    const existingProducts = await ctx.db.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true },
    });

    const validIds = existingProducts.map((p) => p.id);

    if (validIds.length === 0) {
      throw new Error("No valid product IDs were found.");
    }

    // Compute all category + parent category IDs (if applicable)
    const allCategoryIds = categoryIds
      ? await getCategoriesWithParents(ctx.db, categoryIds)
      : [];

    const updatedProducts = await ctx.db.$transaction(
      validIds.map((id) =>
        ctx.db.product.update({
          where: { id },
          data: {
            ...(typeof isPublic === "boolean" && { isPublic }),
            ...(shopId && { shopId }),
            ...(tags && { tags: { set: tags } }),

            ...(categoryIds !== undefined
              ? {
                  categories: {
                    set: allCategoryIds.map((id) => ({ id })),
                  },
                }
              : {}),
          },
        })
      )
    );

    return {
      message: `Successfully updated ${updatedProducts.length} product(s).`,
      data: updatedProducts.map(addFullImageUrl),
    };
  }),
});