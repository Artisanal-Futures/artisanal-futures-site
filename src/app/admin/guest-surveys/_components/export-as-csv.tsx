"use client";

import { type GuestSurvey } from "@prisma/client";

import { Button } from "~/components/ui/button";

interface Props {
  surveys: GuestSurvey[];
}

export function ExportAsCSV({ surveys }: Props) {
  const downloadCSV = () => {
    // Define CSV headers
    const headers = [
      "Name",
      "Country",
      "State",
      "Artisanal Practice",
      "Other Practice",
      "Email",
      "Created At",
    ].join(",");

    // Convert data to CSV rows
    const rows = surveys.map((survey) => {
      return [
        `"${survey.name?.replace(/"/g, '""') ?? ""}"`,
        `"${survey.country?.replace(/"/g, '""') ?? ""}"`,
        `"${survey.state?.replace(/"/g, '""') ?? ""}"`,
        `"${survey.artisanalPractice?.replace(/"/g, '""') ?? ""}"`,
        `"${survey.otherPractice?.replace(/"/g, '""') ?? ""}"`,
        `"${survey.email.replace(/"/g, '""')}"`,
        new Date(survey.createdAt).toLocaleString(),
      ].join(",");
    });

    // Combine headers and rows
    const csv = [headers, ...rows].join("\n");

    // Create and trigger download
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `guest-surveys-${new Date().toISOString()}.csv`,
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Button onClick={downloadCSV} variant="outline" size="sm">
      Export as CSV
    </Button>
  );
}
