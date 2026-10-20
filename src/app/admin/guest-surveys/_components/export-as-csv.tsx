"use client";

import { type GuestSurvey } from "generated/prisma";

import { datestamp, downloadCsv, isoDate, toCsv } from "~/lib/csv";
import { Button } from "~/components/ui/button";

interface Props {
  surveys: GuestSurvey[];
}

export function ExportAsCSV({ surveys }: Props) {
  const downloadCSV = () => {
    const csv = toCsv([
      [
        "Name",
        "Country",
        "State",
        "Artisanal Practice",
        "Other Practice",
        "Email",
        "Created At",
      ],
      ...surveys.map((survey) => [
        survey.name,
        survey.country,
        survey.state,
        survey.artisanalPractice,
        survey.otherPractice,
        survey.email,
        isoDate(survey.createdAt),
      ]),
    ]);

    downloadCsv(`guest-surveys-${datestamp()}.csv`, csv);
  };

  return (
    <Button onClick={downloadCSV} variant="outline" size="sm">
      Export as CSV
    </Button>
  );
}
