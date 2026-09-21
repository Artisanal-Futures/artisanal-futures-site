import { z } from "zod";

import type { ColumnDef } from "./columns";

import {
  boolean,
  httpsUrl,
  optionalText,
  pipeList,
  positiveInt,
  priceDollarsToCents,
  requiredText,
} from "./columns";

/**
 * The service template, in template order. Mirrors `PRODUCT_COLUMNS`: services
 * have no SKU (no unique constraint to protect) and no material/environmental
 * tags, but do carry a duration and a location type.
 */
export const SERVICE_COLUMNS = [
  {
    header: "name",
    required: true,
    description: "The service name shown to clients.",
    examples: ["Beginner Pottery Workshop", "Custom Quilt Consultation"],
  },
  {
    header: "description",
    required: true,
    description: "A short description. Plain text, no HTML.",
    examples: [
      "A two-hour introduction to the potter's wheel. All materials included.",
      "A one-on-one session to plan fabrics, pattern and sizing for a custom quilt.",
    ],
  },
  {
    header: "price",
    required: false,
    description: "Dollars, like 24.99. Leave blank for no price.",
    examples: ["60.00", "0"],
  },
  {
    header: "duration_minutes",
    required: false,
    description: "How long it runs, in whole minutes (e.g. 120).",
    examples: ["120", "45"],
  },
  {
    header: "location_type",
    required: false,
    description:
      "Where it happens, in your own words (e.g. Online or In-Person).",
    examples: ["In-Person", "Online"],
  },
  {
    header: "categories",
    required: false,
    description:
      "Existing service category names separated by | (e.g. Workshops|Ceramics).",
    examples: ["Workshops", "Consulting"],
  },
  {
    header: "tags",
    required: false,
    description: "Your own keywords separated by | (e.g. pottery|beginner).",
    examples: ["pottery|beginner", "quilting"],
  },
  {
    header: "attribute_tags",
    required: false,
    description: "Other attributes separated by | (e.g. small group).",
    examples: ["small group", ""],
  },
  {
    header: "image_url",
    required: false,
    description: "Full https:// link to a photo. Leave blank for no photo.",
    examples: ["https://example.com/images/pottery-workshop.jpg", ""],
  },
  {
    header: "service_url",
    required: false,
    description: "Full https:// link to the service on your own site.",
    examples: ["https://example.com/classes/pottery-workshop", ""],
  },
  {
    header: "is_public",
    required: false,
    description: "true or false. Blank means true.",
    examples: ["true", ""],
  },
] as const satisfies readonly ColumnDef[];

/** Every header the service template defines, as a union of string literals. */
export type ServiceHeader = (typeof SERVICE_COLUMNS)[number]["header"];

/** Compile-time tie between the template and the schema. See product-columns. */
const serviceRowShape = {
  name: requiredText,
  description: requiredText,
  price: priceDollarsToCents,
  duration_minutes: positiveInt,
  location_type: optionalText,
  categories: pipeList,
  tags: pipeList,
  attribute_tags: pipeList,
  image_url: httpsUrl,
  service_url: httpsUrl,
  is_public: boolean(true),
} satisfies Record<ServiceHeader, z.ZodTypeAny>;

const serviceRowObject = z.object(serviceRowShape);

/** Parsed cells, still keyed by CSV header. */
export type ServiceRowFields = z.output<typeof serviceRowObject>;

/** A valid service row, ready to be mapped onto `Prisma.ServiceCreateInput`. */
export type ServiceCsvRow = {
  name: string;
  description: string;
  priceInCents: number | null;
  durationInMinutes: number | null;
  locationType: string | null;
  categories: string[];
  tags: string[];
  attributeTags: string[];
  imageUrl: string | null;
  serviceUrl: string | null;
  isPublic: boolean;
};

export function toServiceCsvRow(parsed: ServiceRowFields): ServiceCsvRow {
  return {
    name: parsed.name,
    description: parsed.description,
    priceInCents: parsed.price,
    durationInMinutes: parsed.duration_minutes,
    locationType: parsed.location_type,
    categories: parsed.categories,
    tags: parsed.tags,
    attributeTags: parsed.attribute_tags,
    imageUrl: parsed.image_url,
    serviceUrl: parsed.service_url,
    isPublic: parsed.is_public,
  };
}

/** Header-keyed cells in, `ServiceCsvRow` out. */
export const serviceRowSchema = serviceRowObject.transform(toServiceCsvRow);
