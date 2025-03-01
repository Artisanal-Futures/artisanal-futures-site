"use client";

import type { Survey } from "~/types/survey";

export const createSurveyFilters = (surveys: Survey[], isElevated: boolean) => {
  const owners = [
    ...new Map(
      surveys.map((survey) => [survey.ownerId, survey.ownerId]),
    ).values(),
  ].filter(Boolean);

  return [
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
