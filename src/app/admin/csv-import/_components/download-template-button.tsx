"use client";

import { Download } from "lucide-react";

import type { ImportType } from "~/lib/csv-import";
import { buildTemplateCsv, templateFileName } from "~/lib/csv-import";
import { Button } from "~/components/ui/button";

export function DownloadTemplateButton({ type }: { type: ImportType }) {
  const handleDownload = () => {
    const csv = buildTemplateCsv(type);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = templateFileName(type);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleDownload}
      className="gap-2"
    >
      <Download className="size-4" />
      Download {type === "products" ? "products" : "services"} template
    </Button>
  );
}
