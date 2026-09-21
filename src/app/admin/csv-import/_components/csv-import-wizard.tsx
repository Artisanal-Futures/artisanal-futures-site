"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  FileSpreadsheet,
  Package,
  Store,
  Upload,
  Wrench,
} from "lucide-react";
import Papa from "papaparse";
import { toast } from "sonner";

import type { ImportType } from "~/lib/csv-import";
import type { CategoryRemaps } from "~/server/api/shared/csv-import";
import type { RouterOutputs } from "~/trpc/react";
import {
  checkHeaders,
  getColumns,
  MAX_IMPORT_ROWS,
  normalizeHeader,
} from "~/lib/csv-import";
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
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";

import { CategoryFixPanel } from "./category-fix-panel";
import { ColumnGuide } from "./column-guide";
import { DownloadTemplateButton } from "./download-template-button";
import { ImportReviewTable } from "./import-review-table";

type Step = "setup" | "upload" | "review" | "success";

type PreviewResult =
  | RouterOutputs["csvImport"]["previewProducts"]
  | RouterOutputs["csvImport"]["previewServices"];

type CommitResult =
  | RouterOutputs["csvImport"]["commitProducts"]
  | RouterOutputs["csvImport"]["commitServices"];

const STEPS: { key: Step; label: string }[] = [
  { key: "setup", label: "Setup" },
  { key: "upload", label: "Upload" },
  { key: "review", label: "Review" },
  { key: "success", label: "Done" },
];

const MAX_FILE_BYTES = 2 * 1024 * 1024;

function itemsLabel(type: ImportType, count: number): string {
  const singular = type === "products" ? "product" : "service";
  return count === 1 ? singular : `${singular}s`;
}

type Props = {
  shops: RouterOutputs["shop"]["getAll"];
  categories: RouterOutputs["category"]["getAll"];
  initialType?: ImportType;
};

export function CsvImportWizard({ shops, categories, initialType }: Props) {
  const [step, setStep] = useState<Step>("setup");
  const [importType, setImportType] = useState<ImportType>(
    initialType ?? "products",
  );
  const [shopId, setShopId] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [headerWarning, setHeaderWarning] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [overrides, setOverrides] = useState<Set<number>>(new Set());
  const [categoryRemaps, setCategoryRemaps] = useState<CategoryRemaps>({});
  const [commitResult, setCommitResult] = useState<CommitResult | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const apiUtils = api.useUtils();

  const selectedShop = shops.find((shop) => shop.id === shopId);

  const resetUploadedData = () => {
    setFileName(null);
    setRawRows([]);
    setHeaderWarning(null);
    setParseError(null);
    setPreview(null);
    setOverrides(new Set());
    setCategoryRemaps({});
  };

  const handleTypeChange = (value: ImportType) => {
    if (value === importType) return;
    setImportType(value);
    resetUploadedData();
  };

  const previewProducts = api.csvImport.previewProducts.useMutation({
    onMutate: () => {
      toast.loading("Analyzing rows...");
    },
    onSuccess: (result) => {
      toast.dismiss();
      setPreview(result);
      setOverrides((prev) => {
        const stillDuplicate = new Set(
          result.rows
            .filter((row) => row.status === "duplicate")
            .map((row) => row.index),
        );
        return new Set([...prev].filter((index) => stillDuplicate.has(index)));
      });
      setStep("review");
    },
    onError: (error) => {
      toast.dismiss();
      toast.error(error.message ?? "Failed to analyze file");
    },
  });

  const previewServices = api.csvImport.previewServices.useMutation({
    onMutate: () => {
      toast.loading("Analyzing rows...");
    },
    onSuccess: (result) => {
      toast.dismiss();
      setPreview(result);
      setOverrides((prev) => {
        const stillDuplicate = new Set(
          result.rows
            .filter((row) => row.status === "duplicate")
            .map((row) => row.index),
        );
        return new Set([...prev].filter((index) => stillDuplicate.has(index)));
      });
      setStep("review");
    },
    onError: (error) => {
      toast.dismiss();
      toast.error(error.message ?? "Failed to analyze file");
    },
  });

  const isAnalyzing = previewProducts.isPending || previewServices.isPending;

  const runPreview = (
    rows: Record<string, string>[],
    remaps: CategoryRemaps,
  ) => {
    const payload = { shopId, rows, categoryRemaps: remaps };
    if (importType === "products") {
      previewProducts.mutate(payload);
    } else {
      previewServices.mutate(payload);
    }
  };

  /**
   * Point an unknown category name at a real category (or `null` to drop it)
   * and re-check every row on the server, since a row may have other errors
   * and the statuses shown must stay the server's.
   */
  const handleRemapCategory = (key: string, value: string | null) => {
    const next = { ...categoryRemaps, [key]: value };
    setCategoryRemaps(next);
    runPreview(rawRows, next);
  };

  const commitProducts = api.csvImport.commitProducts.useMutation({
    onMutate: () => {
      toast.loading("Creating products...");
    },
    onSuccess: (result) => {
      toast.dismiss();
      toast.success(
        `Created ${result.createdCount} ${itemsLabel("products", result.createdCount)}`,
      );
      void apiUtils.product.invalidate();
      setCommitResult(result);
      setStep("success");
    },
    onError: (error) => {
      toast.dismiss();
      toast.error(error.message ?? "Failed to import products");
    },
  });

  const commitServices = api.csvImport.commitServices.useMutation({
    onMutate: () => {
      toast.loading("Creating services...");
    },
    onSuccess: (result) => {
      toast.dismiss();
      toast.success(
        `Created ${result.createdCount} ${itemsLabel("services", result.createdCount)}`,
      );
      void apiUtils.service.invalidate();
      setCommitResult(result);
      setStep("success");
    },
    onError: (error) => {
      toast.dismiss();
      toast.error(error.message ?? "Failed to import services");
    },
  });

  const isCommitting = commitProducts.isPending || commitServices.isPending;

  const handleFile = (file: File) => {
    setParseError(null);
    setHeaderWarning(null);

    if (file.size > MAX_FILE_BYTES) {
      setParseError("File is larger than 2 MB");
      return;
    }

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: normalizeHeader,
      transform: (value) => value.trim(),
      complete: (results) => {
        if (results.errors.length > 0) {
          setParseError(results.errors[0]?.message ?? "Could not parse file");
          return;
        }

        const headers = results.meta.fields ?? [];
        const { missing, unknown } = checkHeaders(importType, headers);

        if (missing.length > 0) {
          setParseError(`Missing required column(s): ${missing.join(", ")}`);
          return;
        }

        setHeaderWarning(
          unknown.length > 0
            ? `Ignored unrecognised column(s): ${unknown.join(", ")}`
            : null,
        );

        if (results.data.length === 0) {
          setParseError("No data rows found");
          return;
        }

        if (results.data.length > MAX_IMPORT_ROWS) {
          setParseError(
            `Too many rows (${results.data.length}). The limit is ${MAX_IMPORT_ROWS} per file.`,
          );
          return;
        }

        const knownHeaders = new Set(
          getColumns(importType).map((column) => column.header),
        );
        const rows = results.data.map((row) => {
          const cleaned: Record<string, string> = {};
          for (const key of Object.keys(row)) {
            if (knownHeaders.has(key)) cleaned[key] = row[key] ?? "";
          }
          return cleaned;
        });

        setRawRows(rows);
        setFileName(file.name);

        setCategoryRemaps({});
        runPreview(rows, {});
      },
    });
  };

  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) handleFile(file);
    event.target.value = "";
  };

  const handleToggleOverride = (index: number) => {
    setOverrides((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleCommit = () => {
    const payload = {
      shopId,
      rows: rawRows,
      createDuplicateIndices: [...overrides],
      categoryRemaps,
    };

    if (importType === "products") {
      commitProducts.mutate(payload);
    } else {
      commitServices.mutate(payload);
    }
  };

  const handleImportAnother = () => {
    resetUploadedData();
    setCommitResult(null);
    setStep("upload");
  };

  const createCount = preview ? preview.counts.valid + overrides.size : 0;

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-foreground text-3xl font-bold tracking-tight">
          Import from CSV
        </h1>
        <p className="text-muted-foreground mt-2">
          Bulk-create products or services for a shop from a spreadsheet.
          Download the template, fill it in, and upload it here.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-10">
        <div className="flex items-center gap-2">
          {STEPS.map((s, i, arr) => {
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
        {step === "setup" && (
          <div className="space-y-8">
            <div>
              <h2 className="text-foreground text-xl font-semibold">
                Choose what to import
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Pick a shop and whether you&apos;re importing products or
                services, then download the template to get started.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-foreground text-sm font-medium">
                Import type
              </label>
              <ToggleGroup
                type="single"
                variant="outline"
                value={importType}
                onValueChange={(value) => {
                  if (value === "products" || value === "services") {
                    handleTypeChange(value);
                  }
                }}
              >
                <ToggleGroupItem value="products" className="gap-2">
                  <Package className="size-4" />
                  Products
                </ToggleGroupItem>
                <ToggleGroupItem value="services" className="gap-2">
                  <Wrench className="size-4" />
                  Services
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="space-y-2">
              <label className="text-foreground text-sm font-medium">
                Your Shop
              </label>
              <Select value={shopId} onValueChange={setShopId}>
                <SelectTrigger
                  className="w-full sm:w-80"
                  aria-label="Your Shop"
                >
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

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <DownloadTemplateButton type={importType} />
            </div>

            <div className="border-border border-t pt-6">
              <ColumnGuide type={importType} categories={categories} />
            </div>

            <div className="flex justify-end pt-4">
              <Button
                onClick={() => setStep("upload")}
                disabled={!shopId}
                className="gap-2"
              >
                Continue
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        )}

        {step === "upload" && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-foreground text-xl font-semibold">
                  Upload your CSV
                </h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  Choose the file you filled in from the template.
                </p>
              </div>
              <span className="text-muted-foreground text-xs">
                <Store className="mr-1 inline size-3" />
                Importing to: {selectedShop?.name}
              </span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              aria-label="Choose CSV file"
              onChange={handleFileInputChange}
            />

            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              onDrop={(event) => {
                event.preventDefault();
                setIsDraggingOver(false);
                const file = event.dataTransfer.files?.[0];
                if (file) handleFile(file);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDraggingOver(true);
              }}
              onDragLeave={() => setIsDraggingOver(false)}
              className={`border-border flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
                isDraggingOver
                  ? "border-primary bg-primary/5"
                  : "hover:border-muted-foreground/50 hover:bg-muted/50"
              }`}
            >
              <FileSpreadsheet className="text-muted-foreground size-8" />
              <div>
                <p className="text-foreground text-sm font-medium">
                  Drag and drop your CSV here
                </p>
                <p className="text-muted-foreground text-sm">or</p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={(event) => {
                  event.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="gap-2"
              >
                <Upload className="size-4" />
                Choose CSV file
              </Button>
            </div>

            {fileName && (
              <p className="text-muted-foreground text-sm">
                <span className="font-medium">{fileName}</span>
                {rawRows.length > 0 &&
                  ` — ${rawRows.length} row${rawRows.length !== 1 ? "s" : ""}`}
                {isAnalyzing && " — analyzing..."}
              </p>
            )}

            {parseError && (
              <div className="border-destructive/30 bg-destructive/10 text-destructive flex items-start gap-2 rounded-lg border p-3 text-sm">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                {parseError}
              </div>
            )}

            <div className="flex items-center justify-between pt-4">
              <Button
                variant="ghost"
                onClick={() => setStep("setup")}
                className="gap-2"
              >
                <ArrowLeft className="size-4" />
                Back
              </Button>
            </div>
          </div>
        )}

        {step === "review" && preview && (
          <div className="space-y-6">
            {headerWarning && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <span>{headerWarning}</span>
              </div>
            )}

            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-foreground text-xl font-semibold">
                  Review your rows
                </h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  Found {rawRows.length} row{rawRows.length !== 1 ? "s" : ""} in{" "}
                  {fileName}.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="default">{preview.counts.valid} valid</Badge>
                <Badge variant="secondary">
                  {preview.counts.duplicate} duplicate
                </Badge>
                <Badge variant="destructive">
                  {preview.counts.invalid} invalid
                </Badge>
              </div>
            </div>

            <CategoryFixPanel
              rows={preview.rows}
              type={importType}
              categories={categories}
              remaps={categoryRemaps}
              onRemap={handleRemapCategory}
              disabled={isAnalyzing}
            />

            <ImportReviewTable
              rows={preview.rows}
              rawRows={rawRows}
              type={importType}
              overrides={overrides}
              onToggleOverride={handleToggleOverride}
            />

            <div className="border-border flex items-center justify-between border-t pt-6">
              <Button
                variant="ghost"
                onClick={() => setStep("upload")}
                className="gap-2"
              >
                <ArrowLeft className="size-4" />
                Back
              </Button>
              <Button
                onClick={handleCommit}
                disabled={createCount === 0 || isCommitting}
                className="gap-2"
              >
                {isCommitting ? (
                  <>
                    <Spinner className="size-4" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Upload className="size-4" />
                    Create {createCount} {itemsLabel(importType, createCount)}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {step === "success" && commitResult && (
          <div className="py-8 text-center">
            <div className="bg-primary/10 mx-auto mb-6 flex size-16 items-center justify-center rounded-full">
              <Check className="text-primary size-8" />
            </div>
            <h2 className="text-foreground text-2xl font-semibold">
              Import complete
            </h2>
            <p className="text-muted-foreground mx-auto mt-2 max-w-md">
              Created {commitResult.createdCount}{" "}
              {itemsLabel(importType, commitResult.createdCount)} for{" "}
              {selectedShop?.name}. {commitResult.skippedInvalid} invalid and{" "}
              {commitResult.skippedDuplicates} duplicate rows were skipped.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button asChild>
                <Link
                  href={
                    importType === "products"
                      ? "/admin/products"
                      : "/admin/services"
                  }
                >
                  View {importType === "products" ? "products" : "services"}
                </Link>
              </Button>
              <Button variant="outline" onClick={handleImportAnother}>
                Import another file
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
