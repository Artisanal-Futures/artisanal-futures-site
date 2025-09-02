/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";

import { toastService } from "@dreamwalker-studios/toasts";

// Note: You will need to create these types for your service data sources
import type {
  ShopifyData,
  SquareSpaceData,
  WordPressProduct as WordPressService, // Re-using type for structure
} from "../_validators/types";
import type { ServiceWithShop } from "~/types/service";
import { api } from "~/trpc/react";
import { useDefaultMutationActions } from "~/hooks/use-default-mutation-actions";
import { Button } from "~/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "~/components/ui/pagination";
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

import { convertToService } from "../_utils/convert-to-service";

const ROWS_PER_PAGE = 10;

const SERVICE_SOURCES = {
  SHOPIFY: "Shopify",
  SQUARESPACE: "Squarespace",
  WORDPRESS: "WordPress",
} as const;

type ServiceSource = keyof typeof SERVICE_SOURCES;

export function DatabaseMigrationClient() {
  const [jsonInput, setJsonInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [parsedFields, setParsedFields] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<ServiceWithShop[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSource, setSelectedSource] = useState<ServiceSource | null>(
    null,
  );
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<
    { field: string; values: string[]; count: number }[]
  >([]);

  const totalPages = Math.ceil(previewData.length / ROWS_PER_PAGE);
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const endIndex = startIndex + ROWS_PER_PAGE;
  const currentData = previewData.slice(startIndex, endIndex);

  const { defaultActions } = useDefaultMutationActions({
    entity: "service", 
  });

  const serviceMigration =
    api.service.importServices.useMutation(defaultActions); 

  const { data: shops } = api.shop.getAll.useQuery();

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

  const parseJSON = async () => {
    try {
      if (!selectedSource) {
        throw new Error("Please select a service source");
      }

      if (!selectedShopId) {
        throw new Error("Please select a shop");
      }

      let convertedServices: Partial<ServiceWithShop>[] = [];
      const parsedJson = JSON.parse(jsonInput);

      if (selectedSource === "SHOPIFY") {
        const shopifyData = parsedJson as ShopifyData;
        convertedServices = shopifyData.products.map( // Assuming service data is in 'products' array
          (service) =>
            convertToService(service, selectedShopId) as Partial<ServiceWithShop>,
        );
      } else if (selectedSource === "SQUARESPACE") {
        const squarespaceData = parsedJson as SquareSpaceData;
        convertedServices = squarespaceData.items.map(
          (service) =>
            convertToService(service, selectedShopId) as Partial<ServiceWithShop>,
        );
      } else if (selectedSource === "WORDPRESS") {
        const wordpressData = parsedJson as WordPressService[];
        convertedServices = await Promise.all(
          wordpressData.map(
            async (service) =>
              (await convertToService(
                service,
                selectedShopId,
              )) as Partial<ServiceWithShop>,
          ),
        );
      }

      if (!convertedServices.length) {
        throw new Error("No services found in the data");
      }
      
      const firstService = convertedServices[0];
      if (!firstService) {
        throw new Error("No services found in the data");
      }
      const fields = Object.keys(firstService);
      setParsedFields(fields);
      setPreviewData(convertedServices as unknown as ServiceWithShop[]);

      toastService.success("Services parsed successfully");
    } catch (error) {
      toastService.error(
        error instanceof Error ? error.message : "Failed to parse data",
      );
      console.error(error);
    }
  };

  const handleMigration = async () => {
    try {
      setLoading(true);
      serviceMigration.mutate(
        previewData.map((service) => ({
          ...service,
          shopId: service.shopId ?? "",
        })),
      );
      toastService.success("Migration completed successfully");
    } catch (error) {
      toastService.error("Failed to execute migration");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 space-y-12">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Service Migration</h2>
        <div className="flex gap-4">
          <Select
            onValueChange={(value) => setSelectedSource(value as ServiceSource)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Service Source" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SERVICE_SOURCES).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select onValueChange={setSelectedShopId}>
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
          <div className="rounded-md bg-muted p-4 text-sm">
            <h4 className="mb-2 font-medium">How to get your service data:</h4>
            <p>Please select a service source to see instructions</p>
          </div>

          <Textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder="Paste service JSON..."
            className="min-h-[200px]"
          />
          <div className="absolute right-2 top-2">
            <Button onClick={parseJSON}>Parse JSON</Button>
          </div>
        </div>
      </div>

      {parsedFields.length > 0 && selectedSource && (
        <>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Check Duplicates</h3>
              <Select
                onValueChange={(value) => {
                  setSelectedField(value);
                  checkDuplicates(value);
                }}
              >
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
              <p className="text-sm text-muted-foreground">
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

            {totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() =>
                        currentPage > 1 &&
                        setCurrentPage((p) => Math.max(1, p - 1))
                      }
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      return (
                        page === 1 ||
                        page === totalPages ||
                        Math.abs(currentPage - page) <= 1
                      );
                    })
                    .map((page, i, arr) => (
                      <PaginationItem key={page}>
                        {i > 0 && arr[i - 1] !== page - 1 ? (
                          <PaginationEllipsis />
                        ) : null}
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        currentPage < totalPages &&
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>

          <Button onClick={handleMigration} disabled={loading}>
            {loading ? "Migrating..." : "Run Migration"}
          </Button>
        </>
      )}
    </div>
  );
}
