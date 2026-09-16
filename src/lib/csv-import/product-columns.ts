import { z } from "zod";

import type { ColumnDef } from "./columns";

import {
  boolean,
  httpsUrl,
  optionalText,
  pipeList,
  priceDollarsToCents,
  requiredText,
} from "./columns";

/**
 * The product template, in template order. The array is the single source of
 * truth: the downloadable CSV, the header check, the docs table and the row
 * schema are all derived from it, so a column cannot be added in one place and
 * forgotten in another.
 */
export const PRODUCT_COLUMNS = [
  {
    header: "name",
    required: true,
    description: "The product name shown to shoppers.",
    examples: ["Hand-thrown Stoneware Mug", "Indigo Cotton Scarf"],
  },
  {
    header: "description",
    required: true,
    description: "A short description. Plain text, no HTML.",
    examples: [
      "Wheel-thrown stoneware mug with a speckled glaze. Holds 12 oz.",
      "Hand-dyed cotton scarf finished with a rolled hem.",
    ],
  },
  {
    header: "price",
    required: false,
    description: "Dollars, like 24.99. Leave blank for no price.",
    examples: ["24.00", "45.50"],
  },
  {
    header: "sku",
    required: false,
    description:
      "Your own product code. Must be unique within the shop. Leave blank to auto-generate.",
    examples: ["MUG-001", ""],
  },
  {
    header: "categories",
    required: false,
    description:
      "Existing product category names separated by | (e.g. Ceramics|Kitchen).",
    examples: ["Ceramics|Kitchen", "Textiles"],
  },
  {
    header: "tags",
    required: false,
    description: "Your own keywords separated by | (e.g. mug|stoneware).",
    examples: ["mug|stoneware", "scarf|indigo"],
  },
  {
    header: "material_tags",
    required: false,
    description: "Materials separated by | (e.g. clay|glaze).",
    examples: ["clay", "cotton"],
  },
  {
    header: "environmental_tags",
    required: false,
    description: "Environmental practices separated by | (e.g. natural dye).",
    examples: ["", "natural dye"],
  },
  {
    header: "attribute_tags",
    required: false,
    description:
      "Other attributes separated by | (e.g. handmade|one of a kind).",
    examples: ["handmade", ""],
  },
  {
    header: "image_url",
    required: false,
    description: "Full https:// link to a photo. Leave blank for no photo.",
    examples: ["https://example.com/images/stoneware-mug.jpg", ""],
  },
  {
    header: "product_url",
    required: false,
    description: "Full https:// link to the product on your own site.",
    examples: ["https://example.com/shop/stoneware-mug", ""],
  },
  {
    header: "is_public",
    required: false,
    description: "true or false. Blank means true.",
    examples: ["true", "false"],
  },
] as const satisfies readonly ColumnDef[];

/** Every header the product template defines, as a union of string literals. */
export type ProductHeader = (typeof PRODUCT_COLUMNS)[number]["header"];

/**
 * `satisfies Record<ProductHeader, ...>` is the compile-time tie between the
 * template and the schema: a column added above without a parser here (or a
 * parser here without a column above) fails to build.
 */
const productRowShape = {
  name: requiredText,
  description: requiredText,
  price: priceDollarsToCents,
  sku: optionalText,
  categories: pipeList,
  tags: pipeList,
  material_tags: pipeList,
  environmental_tags: pipeList,
  attribute_tags: pipeList,
  image_url: httpsUrl,
  product_url: httpsUrl,
  is_public: boolean(true),
} satisfies Record<ProductHeader, z.ZodTypeAny>;

const productRowObject = z.object(productRowShape);

/** Parsed cells, still keyed by CSV header. */
export type ProductRowFields = z.output<typeof productRowObject>;

/** A valid product row, ready to be mapped onto `Prisma.ProductCreateInput`. */
export type ProductCsvRow = {
  name: string;
  description: string;
  priceInCents: number | null;
  sku: string | null;
  categories: string[];
  tags: string[];
  materialTags: string[];
  environmentalTags: string[];
  attributeTags: string[];
  imageUrl: string | null;
  productUrl: string | null;
  isPublic: boolean;
};

export function toProductCsvRow(parsed: ProductRowFields): ProductCsvRow {
  return {
    name: parsed.name,
    description: parsed.description,
    priceInCents: parsed.price,
    sku: parsed.sku,
    categories: parsed.categories,
    tags: parsed.tags,
    materialTags: parsed.material_tags,
    environmentalTags: parsed.environmental_tags,
    attributeTags: parsed.attribute_tags,
    imageUrl: parsed.image_url,
    productUrl: parsed.product_url,
    isPublic: parsed.is_public,
  };
}

/** Header-keyed cells in, `ProductCsvRow` out. */
export const productRowSchema = productRowObject.transform(toProductCsvRow);
