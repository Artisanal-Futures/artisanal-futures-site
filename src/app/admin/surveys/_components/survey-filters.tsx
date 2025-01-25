"use client";

import type { User } from "@prisma/client";

import type { Survey } from "~/types/survey";

export const createSurveyFilters = (surveys: Survey[], isElevated: boolean) => {
  const owners = [
    ...new Map(
      surveys.map((survey) => [survey.ownerId, survey.ownerId]),
    ).values(),
  ].filter(Boolean);

  return [
    {
      column: "processes",
      title: "Processes",
      filters: surveys
        .filter((survey) => survey.processes)
        .map((survey) => ({
          value: survey.processes!,
          label: survey.processes!,
        })),
    },
    {
      column: "materials",
      title: "Materials",
      filters: surveys
        .filter((survey) => survey.materials)
        .map((survey) => ({
          value: survey.materials!,
          label: survey.materials!,
        })),
    },
    isElevated
      ? {
          column: "owner",
          title: "Owner",
          filters: owners.map((ownerId) => ({
            value: ownerId,
            label: ownerId,
          })),
        }
      : [],
  ].flat();
};
