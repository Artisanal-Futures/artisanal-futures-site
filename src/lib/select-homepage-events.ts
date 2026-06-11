import { endOfDay } from "date-fns";

type EventCandidate = {
  startDate: Date;
  endDate: Date | null;
  persist: boolean;
};

function isRelevant(e: EventCandidate, now: Date): boolean {
  return e.endDate ? now <= e.endDate : now <= endOfDay(e.startDate);
}

export function selectHomepageEvents<T extends EventCandidate>(
  events: T[],
): { featured: T | null; rest: T[] } {
  const now = new Date();

  const upcoming = events
    .filter((e) => isRelevant(e, now))
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  const persistedPast = events
    .filter((e) => e.persist && !isRelevant(e, now))
    .sort((a, b) => b.startDate.getTime() - a.startDate.getTime());

  const ordered = [...upcoming, ...persistedPast];
  const featured = ordered[0] ?? null;
  const rest = ordered.slice(1);

  return { featured, rest };
}
