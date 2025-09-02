"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import debounce from "lodash/debounce";
import { Users } from "lucide-react";

import { api } from "~/trpc/react";
import { useOnClickOutside } from "~/hooks/use-on-click-outside";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";

export const SearchBar = () => {
  const [input, setInput] = useState<string>("");
  const pathname = usePathname();
  const commandRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useOnClickOutside(commandRef, () => {
    setInput("");
  });

  const request = debounce(async () => {
    void refetch();
  }, 300);

  const debounceRequest = useCallback(() => {
    void request();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    data: queryResults,
    isFetching,
    isFetched,
    refetch,
  } = api.forumSubreddit.searchSubreddit.useQuery(
    {
      query: input,
    },
    {
      enabled: false,
    },
  );

  useEffect(() => {
    setInput("");
  }, [pathname]);

  // const {
  //   isFetching,
  //   data: queryResults,
  //   refetch,
  //   isFetched,
  // } = useQuery({
  //   queryFn: async () => {
  //     if (!input) return [];
  //     const { data } = await axios.get(`/api/search?q=${input}`);
  //     return data as (Subreddit & {
  //       _count: Prisma.SubredditCountOutputType;
  //     })[];
  //   },
  //   queryKey: ["search-query"],
  //   enabled: false,
  // });
  return (
    <Command
      ref={commandRef}
      className="relative z-50 h-auto max-w-lg overflow-visible rounded-lg border border-border bg-background shadow-sm transition-colors dark:border-border/40 dark:bg-background/95 dark:shadow-md dark:shadow-black/20"
    >
      <CommandInput
        isLoading={isFetching}
        onValueChange={(text) => {
          if (text != null) {
            setInput(text);
            debounceRequest();
          }
        }}
        value={input ?? ""}
        className="border-none outline-none ring-0 focus:border-none focus:outline-none dark:bg-transparent dark:placeholder:text-muted-foreground/70"
        placeholder="Search communities..."
      />

      {input && input.length > 0 && (
        <CommandList className="absolute inset-x-0 top-full rounded-b-md bg-background/95 shadow-lg backdrop-blur-sm dark:bg-background/95 dark:shadow-md dark:shadow-black/20">
          {isFetched && (
            <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </CommandEmpty>
          )}
          {(queryResults?.length ?? 0) > 0 ? (
            <CommandGroup heading="Communities" className="px-2 pb-2">
              {queryResults?.map((subreddit) => (
                <CommandItem
                  onSelect={(e) => {
                    router.push(`/forums/r/${e}`);
                    router.refresh();
                  }}
                  key={subreddit.id}
                  value={subreddit.name}
                  className="flex items-center rounded-md px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/90"
                >
                  <Users className="mr-2 h-4 w-4" />
                  <a
                    href={`/forums/r/${subreddit.name}`}
                    className="flex-1 truncate text-foreground hover:text-foreground dark:text-foreground dark:hover:text-foreground"
                  >
                    r/{subreddit.name}
                  </a>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
        </CommandList>
      )}
    </Command>
  );
};
