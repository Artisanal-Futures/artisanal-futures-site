"use client";

import type { RefObject } from "react";
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

  useOnClickOutside(commandRef as RefObject<HTMLDivElement>, () => {
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
    isFetched,
    refetch,
  } = api.forumSubreddit.searchSubreddit.useQuery(
    { query: input },
    { enabled: false },
  );

  useEffect(() => {
    setInput("");
  }, [pathname]);

  return (
    <Command
      ref={commandRef}
      className="border-border bg-background dark:border-border/40 dark:bg-background/95 relative z-50 h-auto max-w-lg overflow-visible rounded-lg border shadow-sm transition-colors dark:shadow-md dark:shadow-black/20"
    >
      <CommandInput
        onValueChange={(text) => {
          if (text != null) {
            setInput(text);
            debounceRequest();
          }
        }}
        value={input ?? ""}
        className="dark:placeholder:text-muted-foreground/70 border-none ring-0 outline-none focus:border-none focus:outline-none dark:bg-transparent"
        placeholder="Search communities..."
      />

      {input && input.length > 0 && (
        <CommandList className="bg-background/95 dark:bg-background/95 absolute inset-x-0 top-full rounded-b-md shadow-lg backdrop-blur-sm dark:shadow-md dark:shadow-black/20">
          {isFetched && (
            <CommandEmpty className="text-muted-foreground py-6 text-center text-sm">
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
                  className="text-foreground hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/90 flex items-center rounded-md px-3 py-2 text-sm transition-colors"
                >
                  <Users className="mr-2 h-4 w-4" />
                  <a
                    href={`/forums/r/${subreddit.name}`}
                    className="text-foreground hover:text-foreground dark:text-foreground dark:hover:text-foreground flex-1 truncate"
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
