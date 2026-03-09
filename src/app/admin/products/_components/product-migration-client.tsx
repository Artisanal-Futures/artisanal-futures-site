/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type {
  ShopifyData,
  SquareSpaceData,
  WordPressProduct,
} from "../_validators/types";
import type { RouterOutputs } from "~/trpc/react";
import type { ProductWithRelations } from "~/types/product";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Textarea } from "~/components/ui/textarea";

import { mapProducts } from "../_utils/convert-to-product";
import { ProductPagination } from "../migrate/_components/product-pagination";

const ROWS_PER_PAGE = 10;

const PRODUCT_SOURCES = {
  SHOPIFY: "Shopify",
  SQUARESPACE: "Squarespace",
  WORDPRESS: "WordPress",
} as const;

type ProductSource = keyof typeof PRODUCT_SOURCES;

export function DatabaseMigrationClient({
  shops,
}: {
  shops: RouterOutputs["shop"]["getAll"];
}) {
  const [jsonInput, setJsonInput] = useState("");

  const [parsedFields, setParsedFields] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<ProductWithRelations[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSource, setSelectedSource] = useState<ProductSource | null>(
    null,
  );
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [selectedSiteUrl, setSelectedSiteUrl] = useState<string | null>(null);

  const [duplicates, setDuplicates] = useState<
    { field: string; values: string[]; count: number }[]
  >([]);

  const totalPages = Math.ceil(previewData.length / ROWS_PER_PAGE);
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const endIndex = startIndex + ROWS_PER_PAGE;
  const currentData = previewData.slice(startIndex, endIndex);

  const apiUtils = api.useUtils();
  const router = useRouter();

  const productMigration = api.product.importProducts.useMutation({
    onSuccess: () => {
      toast.dismiss();
      toast.success("Products imported successfully");
      void apiUtils.product.invalidate();
      router.refresh();
    },
    onError: (error) => {
      toast.dismiss();
      toast.error(error.message ?? "Failed to import products");
    },
    onMutate: () => {
      toast.loading("Importing products, please wait...");
    },
  });

  const checkDuplicates = (field: string) => {
    const valueMap = new Map<string, number>();
    const duplicateValues: string[] = [];

    previewData.forEach((item) => {
      const value = (item as any)[field]?.toString() ?? "";
      valueMap.set(value, (valueMap.get(value) ?? 0) + 1);
    });

    valueMap.forEach((count, value) => {
      if (count > 1) {
        duplicateValues.push(value);
      }
    });

    if (duplicateValues.length > 0) {
      setDuplicates([
        {
          field,
          values: duplicateValues,
          count: duplicateValues.length,
        },
      ]);
    } else {
      setDuplicates([]);
    }
  };

  // Parse JSON to extract field names and convert to Product type
  const parseJSON = async () => {
    try {
      if (!selectedSource) {
        throw new Error("Please select a product source");
      }

      if (!selectedShopId) {
        throw new Error("Please select a shop");
      }

      // Parse JSON for sources
      const parsedJson = JSON.parse(jsonInput);

      const convertedProducts = await mapProducts({
        parsedJson,
        selectedSource,
        selectedShopId,
        selectedSiteUrl: selectedSiteUrl ?? undefined,
      });
      if (!convertedProducts.length) {
        throw new Error("No products found in the data");
      }
      // Get fields from first product
      const firstProduct = convertedProducts[0];
      if (!firstProduct) {
        throw new Error("No products found in the data");
      }
      const fields = Object.keys(firstProduct);
      setParsedFields(fields);
      setPreviewData(convertedProducts);

      toast.success("Products parsed successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to parse data",
      );
      console.error(error);
    }
  };

  const handleMigration = async () => {
    productMigration.mutate(
      previewData.map((product) => ({
        ...product,
        isFeatured: false,
        shopId: product.shopId ?? "",
        shopProductId: product.shopProductId ?? "",
        tags: product.tags?.map((tag) => ({ id: tag, text: tag })) ?? [],
      })),
    );
  };

  const isPending = productMigration.isPending;

  return (
    <div className="mt-6 space-y-12">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Product Migration</h2>
        <div className="flex gap-4">
          <Select
            onValueChange={(value) => setSelectedSource(value as ProductSource)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Product Source" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PRODUCT_SOURCES).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            onValueChange={(value) => {
              setSelectedShopId(value);
              setSelectedSiteUrl(
                shops?.find((shop) => shop.id === value)?.website ?? null,
              );
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Shop" />
            </SelectTrigger>
            <SelectContent>
              {shops?.map((shop) => (
                <SelectItem key={shop.id} value={shop.id}>
                  {shop.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="relative space-y-2">
          <div className="bg-muted rounded-md p-4 text-sm">
            <h4 className="mb-2 font-medium">How to get your product data:</h4>
            {selectedSource === "SHOPIFY" ? (
              <ol className="list-decimal space-y-1 pl-4">
                <li>Go to your Shopify site</li>
                <li>
                  Add &quot;/products.json?limit=250&quot; to your shop URL
                </li>
                <li>Copy the entire JSON response and paste it below</li>
              </ol>
            ) : selectedSource === "SQUARESPACE" ? (
              <ol className="list-decimal space-y-1 pl-4">
                <li>
                  Go to your Squarespace site, specifically to the page you sell
                  products from (i.e. myshop.com/products)
                </li>
                <li>
                  Add &quot;?format=json-pretty&quot; to the products page URL
                </li>
                <li>Copy the entire JSON response and paste it below</li>
              </ol>
            ) : selectedSource === "WORDPRESS" ? (
              <ol className="list-decimal space-y-1 pl-4">
                <li>Go to your WordPress site</li>
                <li>
                  Add &quot;/wp-json/wp/v2/product?per_page=100&page=1&quot; to
                  your site URL
                </li>
                <li>Copy the entire JSON response and paste it below</li>
                <li>
                  Increase the page number and repeat until you don&apos;t get
                  anymore products.
                </li>
              </ol>
            ) : (
              <p>Please select a product source to see instructions</p>
            )}
          </div>

          <ScrollArea className="h-[500px]" type="always">
            <Textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="Paste product JSON..."
              className="min-h-[200px]"
            />
          </ScrollArea>

          <div className="absolute top-2 right-2">
            <Button onClick={parseJSON}>Format your product data</Button>
          </div>
        </div>

        <div className="relative space-y-2">
          <div className="bg-muted rounded-md p-4 text-sm">
            <h2 className="mb-2 text-lg font-medium">
              First, please select your shop and the platform you&apos;re
              migrating from:
            </h2>

            <div className="flex gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="shop">Shop</Label>
                <Select
                  onValueChange={(value) => {
                    setSelectedShopId(value);
                    setSelectedSiteUrl(
                      shops?.find((shop) => shop.id === value)?.website ?? null,
                    );
                  }}
                >
                  <SelectTrigger className="w-[200px]" id="shop">
                    <SelectValue placeholder="Select Shop" />
                  </SelectTrigger>
                  <SelectContent>
                    {shops?.map((shop) => (
                      <SelectItem key={shop.id} value={shop.id}>
                        {shop.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="product-source">
                  What platform are you migrating from?
                </Label>
                <Select
                  onValueChange={(value) =>
                    setSelectedSource(value as ProductSource)
                  }
                >
                  <SelectTrigger className="w-[200px]" id="product-source">
                    <SelectValue placeholder="Select Product Source" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRODUCT_SOURCES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {parsedFields.length > 0 && selectedSource && (
        <>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Check Duplicates</h3>
              <Select onValueChange={checkDuplicates}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select field to check" />
                </SelectTrigger>
                <SelectContent>
                  {parsedFields.map((field) => (
                    <SelectItem key={field} value={field}>
                      {field}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {duplicates.length > 0 && (
              <div className="rounded-md border bg-yellow-50 p-4">
                <h4 className="font-medium">
                  Found {duplicates[0]?.count} duplicate values for field &quot;
                  {duplicates[0]?.field}&quot;:
                </h4>
                <ul className="mt-2 list-disc pl-5">
                  {duplicates[0]?.values?.map((value, index) => (
                    <li key={index}>{value}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Data Preview</h3>
              <p className="text-muted-foreground text-sm">
                Total rows: {previewData.length}
              </p>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Row</TableHead>
                    {parsedFields.map((field) => (
                      <TableHead key={field}>{field}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentData.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      <TableCell className="font-medium">
                        {startIndex + rowIndex + 1}
                      </TableCell>
                      {parsedFields.map((field) => (
                        <TableCell key={field}>{(row as any)[field]}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <ProductPagination
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              totalPages={totalPages}
            />
          </div>

          <Button onClick={handleMigration} disabled={isPending}>
            {isPending ? "Importing..." : "Import Products"}
          </Button>
        </>
      )}
    </div>
  );
}
