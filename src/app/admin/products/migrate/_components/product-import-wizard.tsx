"use client";

import { Fragment, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  DownloadCloud,
  FileJson,
  Package,
  Store,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import type { ProductData } from "../../_utils/convert-to-product";
import type { RouterOutputs } from "~/trpc/react";
import type { ProductWithRelations } from "~/types/product";
import { api } from "~/trpc/react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Spinner } from "~/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Textarea } from "~/components/ui/textarea";

import { mapProducts } from "../../_utils/convert-to-product";

type Platform = "squarespace" | "wordpress" | "shopify";
type Step = "select" | "paste" | "review" | "success";

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

const ITEMS_PER_PAGE = 20;

export function ProductImportWizard({
  shops,
}: {
  shops: RouterOutputs["shop"]["getAll"];
}) {
  const [step, setStep] = useState<Step>("select");
  const [selectedShop, setSelectedShop] = useState<string>("");
  const [selectedSiteUrl, setSelectedSiteUrl] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | "">("");
  const [jsonInput, setJsonInput] = useState<string>("");
  const [parsedProducts, setParsedProducts] = useState<ProductWithRelations[]>(
    [],
  );
  const [parseError, setParseError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const canProceedToNext =
    step === "select" ? selectedShop && selectedPlatform : true;

  const totalPages = Math.ceil(parsedProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return parsedProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [parsedProducts, currentPage]);

  const apiUtils = api.useUtils();

  const productMigration = api.product.importProducts.useMutation({
    onSuccess: () => {
      toast.dismiss();
      toast.success("Products imported successfully");
      void apiUtils.product.invalidate();
      setStep("success");
    },
    onError: (error) => {
      toast.dismiss();
      toast.error(error.message ?? "Failed to import products");
    },
    onMutate: () => {
      toast.loading("Importing products, please wait...");
    },
  });

  const parseJsonString = async (raw: string) => {
    setParseError(null);
    try {
      const parsedJson = JSON.parse(raw) as ProductData;
      const products = await mapProducts({
        parsedJson: parsedJson,
        selectedSource: selectedPlatform,
        selectedShopId: selectedShop,
        selectedSiteUrl: selectedSiteUrl ?? undefined,
      });

      if (products.length === 0) {
        throw new Error("No products found in the provided JSON");
      }

      setParsedProducts(products);
      setCurrentPage(1);
      setStep("review");
    } catch (err) {
      setParseError(
        err instanceof SyntaxError
          ? "Invalid JSON format. Please check your input."
          : err instanceof Error
            ? err.message
            : "Failed to parse products",
      );
    }
  };

  const handleParse = () => parseJsonString(jsonInput);

  const fetchFromStore = api.product.fetchFromStore.useMutation({
    onSuccess: async ({ json, count }) => {
      toast.dismiss();
      if (count === 0) {
        toast.error("No products found at your store.");
        return;
      }
      setJsonInput(json);
      toast.success(
        `Fetched ${count} product${count !== 1 ? "s" : ""} from your store.`,
      );
      await parseJsonString(json);
    },
    onError: (error) => {
      toast.dismiss();
      toast.error(error.message ?? "Could not fetch from your store.");
    },
    onMutate: () => {
      toast.loading("Fetching products from your store...");
    },
  });

  const handleImport = async () => {
    productMigration.mutate(
      parsedProducts.map((product) => ({
        ...product,
        isFeatured: false,
        shopId: product.shopId ?? "",
        shopProductId: product.shopProductId ?? "",
        tags: product.tags?.map((tag) => ({ id: tag, text: tag })) ?? [],
      })),
    );
  };

  const toggleRowExpand = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectedArtisan = shops.find((s) => s.id === selectedShop);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-foreground text-3xl font-bold tracking-tight">
          Import Products
        </h1>
        <p className="text-muted-foreground mt-2">
          Bring your existing products into the platform from your current
          e-commerce provider.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-10">
        <div className="flex items-center gap-2">
          {[
            { key: "select", label: "Select Shop" },
            { key: "paste", label: "Paste JSON" },
            { key: "review", label: "Review" },
            { key: "success", label: "Complete" },
          ].map((s, i, arr) => {
            const stepIndex = ["select", "paste", "review", "success"].indexOf(
              step,
            );
            const isActive = s.key === step;
            const isComplete = stepIndex > i;

            return (
              <div key={s.key} className="flex items-center gap-2">
                <div
                  className={`flex size-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : isComplete
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isComplete ? <Check className="size-4" /> : i + 1}
                </div>
                <span
                  className={`hidden text-sm sm:inline ${
                    isActive
                      ? "text-foreground font-medium"
                      : "text-muted-foreground"
                  }`}
                >
                  {s.label}
                </span>
                {i < arr.length - 1 && (
                  <div
                    className={`h-px w-8 sm:w-12 ${
                      isComplete ? "bg-primary/40" : "bg-border"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="border-border bg-card rounded-2xl border p-6 shadow-sm sm:p-8">
        {step === "select" && (
          <div className="space-y-8">
            <div>
              <h2 className="text-foreground text-xl font-semibold">
                Select Your Shop & Platform
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Choose which shop you want to import products to and where your
                products are currently hosted.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {/* Shop Selection */}
              <div className="space-y-2">
                <label className="text-foreground text-sm font-medium">
                  Your Shop
                </label>
                <Select
                  value={selectedShop}
                  onValueChange={(value) => {
                    setSelectedShop(value);
                    setSelectedSiteUrl(
                      shops.find((shop) => shop.id === value)?.website ?? null,
                    );
                  }}
                >
                  <SelectTrigger className="w-full" aria-label="Your Shop">
                    <SelectValue placeholder="Select a shop" />
                  </SelectTrigger>
                  <SelectContent>
                    {shops.map((shop) => (
                      <SelectItem key={shop.id} value={shop.id}>
                        <div className="flex items-center gap-2">
                          <Store className="text-muted-foreground size-4" />
                          {shop.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Platform Selection */}
              <div className="space-y-2">
                <label className="text-foreground text-sm font-medium">
                  Current Platform
                </label>
                <Select
                  value={selectedPlatform}
                  onValueChange={(v) => setSelectedPlatform(v as Platform)}
                >
                  <SelectTrigger className="w-full" aria-label="Current Platform">
                    <SelectValue placeholder="Select a platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="squarespace">Squarespace</SelectItem>
                    <SelectItem value="wordpress">
                      WordPress / WooCommerce
                    </SelectItem>
                    <SelectItem value="shopify">Shopify</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Platform Instructions */}
            {selectedPlatform && (
              <div className="border-border bg-secondary/30 rounded-xl border p-5">
                <h3 className="text-foreground font-medium">
                  How to export from{" "}
                  {selectedPlatform === "wordpress"
                    ? "WordPress/WooCommerce"
                    : selectedPlatform.charAt(0).toUpperCase() +
                      selectedPlatform.slice(1)}
                </h3>
                <div className="text-muted-foreground mt-3 space-y-2 text-sm">
                  {selectedPlatform === "squarespace" && (
                    <>
                      <p>
                        1. Go to your Squarespace site, specifically to the page
                        you sell products from (i.e. myshop.com/products)
                      </p>
                      <p>
                        2. Add &quot;?format=json-pretty&quot; to the products
                        page URL
                      </p>
                      <p>3. Copy the entire JSON response</p>
                    </>
                  )}
                  {selectedPlatform === "wordpress" && (
                    <>
                      <p>1. Go to your WordPress site</p>
                      <p>
                        2. Add
                        &quot;/wp-json/wp/v2/product?per_page=100&page=1&quot;
                        to your site URL
                      </p>
                      <p>
                        3. Copy the full JSON response. If you have more than
                        100 products, you will need to increase the page number
                        and repeat until you don&apos;t get anymore products.
                      </p>
                    </>
                  )}
                  {selectedPlatform === "shopify" && (
                    <>
                      <p>1. Go to your Shopify site</p>
                      <p>
                        2. Add &quot;/products.json?limit=250&quot; to your shop
                        URL
                      </p>
                      <p>3. Copy the entire JSON response</p>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button
                onClick={() => setStep("paste")}
                disabled={!canProceedToNext}
                className="gap-2"
              >
                Continue
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        )}

        {step === "paste" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-foreground text-xl font-semibold">
                Paste Your Product JSON
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Paste the JSON export from{" "}
                {selectedPlatform === "wordpress"
                  ? "WordPress/WooCommerce"
                  : selectedPlatform?.charAt(0).toUpperCase() +
                    selectedPlatform?.slice(1)}{" "}
                below.
              </p>
            </div>

            {(selectedPlatform === "shopify" ||
              selectedPlatform === "wordpress") && (
              <div className="border-border bg-secondary/30 rounded-xl border p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-foreground text-sm font-medium">
                      Fetch automatically
                    </p>
                    <p className="text-muted-foreground mt-0.5 text-sm">
                      Pull your products directly — no copy-paste needed.
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      if (
                        selectedPlatform === "shopify" ||
                        selectedPlatform === "wordpress"
                      ) {
                        fetchFromStore.mutate({
                          shopId: selectedShop,
                          platform: selectedPlatform,
                        });
                      }
                    }}
                    disabled={fetchFromStore.isPending}
                    className="shrink-0 gap-2"
                  >
                    {fetchFromStore.isPending ? (
                      <>
                        <Spinner className="size-4" />
                        Fetching…
                      </>
                    ) : (
                      <>
                        <DownloadCloud className="size-4" />
                        Fetch from my store
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {(selectedPlatform === "shopify" ||
              selectedPlatform === "wordpress") && (
              <div className="relative flex items-center py-1">
                <div className="border-border flex-grow border-t" />
                <span className="text-muted-foreground mx-3 shrink-0 text-xs">
                  or paste manually
                </span>
                <div className="border-border flex-grow border-t" />
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="json-data-input" className="text-foreground text-sm font-medium">
                  JSON Data
                </label>
                <span className="text-muted-foreground text-xs">
                  <FileJson className="mr-1 inline size-3" />
                  Importing to: {selectedArtisan?.name}
                </span>
              </div>
              <Textarea
                id="json-data-input"
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder={`Paste your ${selectedPlatform} JSON export here...`}
                className="max-h-[500px] min-h-[300px] font-mono text-sm"
              />
              {parseError && (
                <div className="border-destructive/30 bg-destructive/10 text-destructive flex items-start gap-2 rounded-lg border p-3 text-sm">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  {parseError}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4">
              <Button
                variant="ghost"
                onClick={() => setStep("select")}
                className="gap-2"
              >
                <ArrowLeft className="size-4" />
                Back
              </Button>
              <Button
                onClick={handleParse}
                disabled={!jsonInput.trim()}
                className="gap-2"
              >
                Parse & Review
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        )}

        {step === "review" && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-foreground text-xl font-semibold">
                  Review Your Products
                </h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  Found {parsedProducts.length} product
                  {parsedProducts.length !== 1 ? "s" : ""} to import to{" "}
                  {selectedArtisan?.name}.
                </p>
              </div>
              <Badge variant="secondary" className="text-sm">
                {parsedProducts.length} products
              </Badge>
            </div>

            {/* Products Table */}
            <div className="border-border rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-12"></TableHead>
                    <TableHead className="w-16">Image</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Description
                    </TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Product URL
                    </TableHead>
                    <TableHead className="hidden sm:table-cell">Tags</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProducts.map((product, index) => {
                    const isExpanded = expandedRows.has(product.id);
                    return (
                      <Fragment key={`${product.id}-${index}`}>
                        <TableRow>
                          <TableCell>
                            <button
                              onClick={() => toggleRowExpand(product.id)}
                              className="hover:bg-muted rounded p-1 md:hidden"
                              aria-label={isExpanded ? "Collapse row" : "Expand row"}
                              aria-expanded={isExpanded}
                            >
                              {isExpanded ? (
                                <ChevronUp className="size-4" aria-hidden="true" />
                              ) : (
                                <ChevronDown className="size-4" aria-hidden="true" />
                              )}
                            </button>
                          </TableCell>
                          <TableCell>
                            {product.imageUrl ? (
                              <div className="border-border relative size-10 overflow-hidden rounded border">
                                <Image
                                  src={product.imageUrl}
                                  alt={product.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="border-border bg-muted flex size-10 items-center justify-center rounded border">
                                <Package className="text-muted-foreground size-4" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            <span className="line-clamp-1">{product.name}</span>
                            <span className="text-muted-foreground block text-xs md:hidden">
                              ID: {product.id}
                            </span>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <span className="text-muted-foreground line-clamp-2 text-sm">
                              {product.description
                                ? product.description
                                    .split(" ")
                                    .slice(0, 25)
                                    .join(" ") +
                                  (product.description.split(" ").length > 25
                                    ? "…"
                                    : "")
                                : "No description"}
                            </span>
                          </TableCell>

                          <TableCell className="hidden md:table-cell">
                            <span className="text-muted-foreground line-clamp-2 text-sm">
                              {product.productUrl ??
                                "No product link available"}
                            </span>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <div className="flex flex-wrap gap-1">
                              {product.tags?.slice(0, 2).map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {tag}
                                </Badge>
                              ))}
                              {(product.tags?.length || 0) > 2 && (
                                <span className="text-muted-foreground text-xs">
                                  +{(product.tags?.length || 0) - 2}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {!!product.priceInCents
                              ? formatPrice(product.priceInCents ?? 0)
                              : "N/A"}{" "}
                          </TableCell>
                        </TableRow>
                        {/* Expanded row for mobile */}
                        {isExpanded && (
                          <TableRow
                            key={`${product.id}-expanded`}
                            className="md:hidden"
                          >
                            <TableCell colSpan={6} className="bg-muted/30 p-4">
                              <div className="space-y-2 text-sm">
                                <div>
                                  <span className="font-medium">
                                    Description:
                                  </span>
                                  <p className="text-muted-foreground mt-1">
                                    {product.description || "No description"}
                                  </p>
                                </div>
                                {product.tags && product.tags.length > 0 && (
                                  <div>
                                    <span className="font-medium">Tags:</span>
                                    <div className="mt-1 flex flex-wrap gap-1">
                                      {product.tags.map((tag) => (
                                        <Badge
                                          key={tag}
                                          variant="outline"
                                          className="text-xs"
                                        >
                                          {tag}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-sm">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                  {Math.min(
                    currentPage * ITEMS_PER_PAGE,
                    parsedProducts.length,
                  )}{" "}
                  of {parsedProducts.length}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}

            <div className="border-border flex items-center justify-between border-t pt-6">
              <Button
                variant="ghost"
                onClick={() => setStep("paste")}
                className="gap-2"
              >
                <ArrowLeft className="size-4" />
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={productMigration.isPending}
                className="gap-2"
              >
                {productMigration.isPending ? (
                  <>
                    <Spinner className="size-4" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="size-4" />
                    Import {parsedProducts.length} Products
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="py-8 text-center">
            <div className="bg-primary/10 mx-auto mb-6 flex size-16 items-center justify-center rounded-full">
              <Check className="text-primary size-8" />
            </div>
            <h2 className="text-foreground text-2xl font-semibold">
              Import Complete!
            </h2>
            <p className="text-muted-foreground mx-auto mt-2 max-w-md">
              Successfully imported {parsedProducts.length} product
              {parsedProducts.length !== 1 ? "s" : ""} to{" "}
              {selectedArtisan?.name}. Your products are now live on the
              platform.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button asChild>
                <Link href={`/admin/products`}>View Products</Link>
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setStep("select");
                  setSelectedShop("");
                  setSelectedPlatform("");
                  setJsonInput("");
                  setParsedProducts([]);
                }}
              >
                Import More Products
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
