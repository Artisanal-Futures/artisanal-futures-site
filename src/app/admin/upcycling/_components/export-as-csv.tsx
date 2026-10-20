"use client";

import type { UpcyclingItem } from "~/types";
import { datestamp, downloadCsv, isoDate, toCsv } from "~/lib/csv";
import { Button } from "~/components/ui/button";

type Props = {
  upcycling: UpcyclingItem[];
};

export function ExportAsCSV({ upcycling }: Props) {
  const downloadCSV = () => {
    const csv = toCsv([
      [
        "Project Title",
        "User Email",
        "Prompt",
        "Question",
        "AI Response",
        "Like Status",
        "Like Category",
        "Like Reason",
        "Created At",
      ],
      ...upcycling.map((item) => [
        item.project_title,
        item.user?.email ?? "Guest",
        item.prompt,
        item.question,
        item.llm_response,
        item.like?.is_liked
          ? "Liked"
          : item.like?.is_liked === false
            ? "Disliked"
            : "No Rating",
        item.like?.mod_category,
        item.like?.reason,
        isoDate(item.generation_date),
      ]),
    ]);

    downloadCsv(`upcycling-export-${datestamp()}.csv`, csv);
  };

  return (
    <Button onClick={downloadCSV} variant="outline" size="sm">
      Export as CSV
    </Button>
  );
}
