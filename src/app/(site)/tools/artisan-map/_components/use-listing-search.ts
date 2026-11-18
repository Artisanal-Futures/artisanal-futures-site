"use client";

import { useMemo, useState } from "react";
import { keepPreviousData, skipToken } from "@tanstack/react-query";

import type {
  MapSearchResponse,
  MapShopMatch,
} from "~/lib/search/map-listing-types";
import { api } from "~/trpc/react";

import { mapSearchInput } from "../_lib/listing-search";

export type ListingSearch = {
  /** The query the view reflects: use this, not the URL's, for filtering. */
  appliedQuery: string;
  /** Server matches for `appliedQuery`; null when there are none to apply. */
  matches: ReadonlyMap<string, MapShopMatch> | null;
  /** False while a first search or placeholder is showing, or after a failure. */
  settled: boolean;
  isFetching: boolean;
  failed: boolean;
  isFuzzy: boolean;
  truncated: boolean;
};

/**
 * Listing search for the map, reduced to what the view should reflect: the last
 * settled response, so pins hold still while a new search runs. `q` comes from
 * the URL, which `SearchBox` already debounces.
 */
export function useListingSearch(
  q: string,
  category: string | null,
): ListingSearch {
  const input = mapSearchInput(q, category);
  const { data, isFetching, isError, isPlaceholderData } =
    api.shop.searchMapListings.useQuery(input ?? skipToken, {
      placeholderData: keepPreviousData,
      retry: 1,
      refetchOnWindowFocus: false,
    });

  const [lastApplied, setLastApplied] = useState("");

  let appliedQuery: string;
  let response: MapSearchResponse | null = null;
  let failed = false;

  // Placeholder data outlives a gap with no search. It is only "the previous
  // results" if it is still what the view shows; otherwise, searching again
  // after clearing the box would bring back the old search's pins.
  if (!input) {
    appliedQuery = q;
  } else if (data && (!isPlaceholderData || data.query === lastApplied)) {
    appliedQuery = q ? data.query : "";
    // After the text is cleared, a placeholder still answers the old text.
    if (data.query === appliedQuery) response = data;
  } else if (isError) {
    appliedQuery = q;
    failed = true;
  } else {
    appliedQuery = lastApplied;
  }

  if (appliedQuery !== lastApplied) setLastApplied(appliedQuery);

  const matches = useMemo(
    () =>
      response
        ? new Map(response.matches.map((match) => [match.shopId, match]))
        : null,
    [response],
  );

  return {
    appliedQuery,
    matches,
    settled: !input || (!!data && !isPlaceholderData),
    isFetching: !!input && isFetching,
    failed,
    isFuzzy: response?.isFuzzy ?? false,
    truncated: response?.truncated ?? false,
  };
}
