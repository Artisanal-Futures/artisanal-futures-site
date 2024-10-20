import { Switch } from "@headlessui/react";
import type { User } from "@prisma/client";
import { matchSorter } from "match-sorter";
import type { ChangeEvent, ClipboardEvent, DragEvent } from "react";
import * as React from "react";
import { useDetectClickOutside } from "react-detect-click-outside";

import TextareaAutosize, {
  type TextareaAutosizeProps,
} from "react-textarea-autosize";
import getCaretCoordinates from "textarea-caret";
import TextareaMarkdown, {
  type TextareaMarkdownRef,
} from "textarea-markdown-editor";
import { useItemList, type ItemOptions } from "use-item-list";
import { HtmlView } from "~/apps/forum/components/html-view";
import {
  BoldIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
} from "~/apps/forum/components/icons";
import { env } from "~/env.mjs";
import { api } from "~/utils/api";
import {
  getSuggestionData,
  markdownToHtml,
  uploadImageCommandHandler,
} from "~/utils/forum/editor";

import { classNames } from "~/utils/styles";

type MarkdownEditorProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onTriggerSubmit?: () => void;
} & Omit<
  TextareaAutosizeProps,
  "value" | "onChange" | "onKeyDown" | "onInput" | "onPaste" | "onDrop"
>;

type SuggestionResult = {
  label: string;
  value: string;
};

type SuggestionPosition = {
  top: number;
  left: number;
};

type SuggestionType = "mention" | "emoji";

type SuggestionState = {
  isOpen: boolean;
  type: SuggestionType | null;
  position: SuggestionPosition | null;
  triggerIdx: number | null;
  query: string;
};

type SuggestionActionType =
  | {
      type: "open";
      payload: {
        type: SuggestionType;
        position: SuggestionPosition;
        triggerIdx: number;
        query: string;
      };
    }
  | { type: "close" }
  | { type: "updateQuery"; payload: string };

function suggestionReducer(
  state: SuggestionState,
  action: SuggestionActionType
) {
  switch (action.type) {
    case "open":
      return {
        isOpen: true,
        type: action.payload.type,
        position: action.payload.position,
        triggerIdx: action.payload.triggerIdx,
        query: action.payload.query,
      };
    case "close":
      return {
        isOpen: false,
        type: null,
        position: null,
        triggerIdx: null,
        query: "",
      };
    case "updateQuery":
      return { ...state, query: action.payload };
    default:
      throw new Error();
  }
}

const TOOLBAR_ITEMS = [
  {
    commandTrigger: "bold",
    icon: <BoldIcon className="h-4 w-4" />,
    name: "Bold",
  },
  {
    commandTrigger: "italic",
    icon: <ItalicIcon className="h-4 w-4" />,
    name: "Italic",
  },
  {
    commandTrigger: "unordered-list",
    icon: <ListIcon className="h-4 w-4" />,
    name: "Unordered List",
  },
  {
    commandTrigger: "link",
    icon: <LinkIcon className="h-4 w-4" />,
    name: "Link",
  },
];

function MarkdownPreview({ markdown }: { markdown: string }) {
  return (
    <div className="mt-8 border-b pb-6">
      {markdown ? (
        <HtmlView html={markdownToHtml(markdown)} />
      ) : (
        <p>Nothing to preview</p>
      )}
    </div>
  );
}

export function MarkdownEditor({
  label,
  value,
  minRows = 15,
  onChange,
  onTriggerSubmit,
  ...rest
}: MarkdownEditorProps) {
  const textareaMarkdownRef = React.useRef<TextareaMarkdownRef>(null);
  const [showPreview, setShowPreview] = React.useState(false);
  const [suggestionState, suggestionDispatch] = React.useReducer(
    suggestionReducer,
    {
      isOpen: false,
      type: null,
      position: null,
      triggerIdx: null,
      query: "",
    }
  );

  function closeSuggestion() {
    suggestionDispatch({ type: "close" });
  }

  return (
    <div>
      {label && <label className="mb-2 block font-semibold">{label}</label>}
      <div>
        <div className="flex items-center justify-between gap-4 rounded border bg-forum-primary px-4 py-px">
          <div className="-ml-2 flex gap-2">
            {TOOLBAR_ITEMS.map((toolbarItem) => (
              <button
                key={toolbarItem.commandTrigger}
                type="button"
                onClick={() => {
                  textareaMarkdownRef.current?.trigger(
                    toolbarItem.commandTrigger
                  );
                }}
                className={classNames(
                  "focus-ring inline-flex h-8 w-8 items-center justify-center rounded focus:border disabled:cursor-default disabled:opacity-50",
                  !showPreview && "transition-colors hover:text-forum-blue"
                )}
                disabled={showPreview}
                title={toolbarItem.name}
              >
                {toolbarItem.icon}
              </button>
            ))}
          </div>

          <Switch.Group as="div" className="flex items-center">
            <Switch
              checked={showPreview}
              onChange={(value) => {
                if (value === false) {
                  textareaMarkdownRef.current?.focus();
                }
                setShowPreview(value);
              }}
              className={classNames(
                showPreview ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-700",
                "focus-ring relative inline-flex h-[18px] w-8 flex-shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out"
              )}
            >
              <span
                className={classNames(
                  showPreview ? "translate-x-4" : "translate-x-0.5",
                  "inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 ease-in-out dark:bg-gray-100"
                )}
              />
            </Switch>
            <Switch.Label
              as="span"
              className="ml-2 cursor-pointer select-none text-xs"
            >
              Preview
            </Switch.Label>
          </Switch.Group>
        </div>

        <div className={classNames("relative mt-2", showPreview && "sr-only")}>
          <TextareaMarkdown.Wrapper ref={textareaMarkdownRef}>
            <TextareaAutosize
              {...rest}
              value={value}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
                onChange(event.target.value);

                const { keystrokeTriggered, triggerIdx, type, query } =
                  getSuggestionData(event.currentTarget);

                if (!keystrokeTriggered) {
                  if (suggestionState.isOpen) {
                    closeSuggestion();
                  }
                  return;
                }

                if (suggestionState.isOpen) {
                  suggestionDispatch({ type: "updateQuery", payload: query });
                } else {
                  const coords = getCaretCoordinates(
                    event.currentTarget,
                    triggerIdx + 1
                  );
                  suggestionDispatch({
                    type: "open",
                    payload: {
                      type,
                      position: {
                        top: coords.top + coords.height,
                        left: coords.left,
                      },
                      triggerIdx,
                      query,
                    },
                  });
                }
              }}
              onKeyDown={(event) => {
                const { code, metaKey } = event;
                if (code === "Enter" && metaKey) {
                  onTriggerSubmit?.();
                }
              }}
              onPaste={(event: ClipboardEvent<HTMLTextAreaElement>) => {
                if (env.NEXT_PUBLIC_ENABLE_IMAGE_UPLOAD) {
                  const filesArray = Array.from(event.clipboardData.files);

                  if (filesArray.length === 0) {
                    return;
                  }

                  const imageFiles = filesArray.filter((file) =>
                    /image/i.test(file.type)
                  );

                  if (imageFiles.length === 0) {
                    return;
                  }

                  event.preventDefault();

                  uploadImageCommandHandler(event.currentTarget, imageFiles);
                }
              }}
              onDrop={(event: DragEvent<HTMLTextAreaElement>) => {
                if (env.NEXT_PUBLIC_ENABLE_IMAGE_UPLOAD) {
                  const filesArray = Array.from(event.dataTransfer.files);

                  if (filesArray.length === 0) {
                    return;
                  }

                  const imageFiles = filesArray.filter((file) =>
                    /image/i.test(file.type)
                  );

                  if (imageFiles.length === 0) {
                    return;
                  }

                  event.preventDefault();

                  uploadImageCommandHandler(event.currentTarget, imageFiles);
                }
              }}
              className="focus-ring block w-full rounded border-forum-secondary bg-forum-secondary shadow-sm"
              minRows={minRows}
            />
          </TextareaMarkdown.Wrapper>

          <Suggestion
            state={suggestionState}
            onSelect={(suggestionResult: SuggestionResult) => {
              const preSuggestion = value.slice(0, suggestionState.triggerIdx!);
              const postSuggestion = value.slice(
                textareaMarkdownRef.current?.selectionStart
              );

              let suggestionInsertion = "";

              if (suggestionState.type === "mention") {
                suggestionInsertion = `[${suggestionResult.label}](/profile/${suggestionResult.value})`;
              }

              if (suggestionState.type === "emoji") {
                suggestionInsertion = suggestionResult.value;
              }

              const newEditorValue = `${preSuggestion}${suggestionInsertion} ${postSuggestion}`;

              onChange(newEditorValue);
              closeSuggestion();

              setTimeout(() => {
                const caretPosition =
                  newEditorValue.length - postSuggestion.length;

                textareaMarkdownRef.current?.focus();
                textareaMarkdownRef.current?.setSelectionRange(
                  caretPosition,
                  caretPosition
                );
              }, 0);
            }}
            onClose={closeSuggestion}
          />
        </div>

        {showPreview && <MarkdownPreview markdown={value} />}
      </div>
    </div>
  );
}

function Suggestion({
  state,
  onSelect,
  onClose,
}: {
  state: SuggestionState;
  onSelect: (suggestionResult: SuggestionResult) => void;
  onClose: () => void;
}) {
  const isMentionType = state.type === "mention";
  const isEmojiType = state.type === "emoji";

  const emojiListQuery = api.user.emojiList.useQuery({
    enabled: state.isOpen && isEmojiType,
    staleTime: Infinity,
  });

  const mentionListQuery = api.user.mentionList.useQuery(
    {},
    {
      enabled: state.isOpen && isMentionType,
      staleTime: 5 * 60 * 1000,
    }
  );

  let suggestionList: SuggestionResult[] = [];

  if (isMentionType && mentionListQuery.data) {
    suggestionList = matchSorter(mentionListQuery.data as User[], state.query, {
      keys: ["name"],
    })
      .slice(0, 5)
      .map((item: User) => ({ label: item.name!, value: item.id }));
  }

  if (isEmojiType && emojiListQuery.data) {
    suggestionList = matchSorter(emojiListQuery.data, state.query, {
      keys: ["names", "tags"],
      threshold: matchSorter.rankings.STARTS_WITH,
    })
      .slice(0, 5)
      .map((item) => ({
        label: `${item.emoji} ${item.names[0]}`,
        value: item.emoji,
      }));
  }

  if (!state.isOpen || !state.position || suggestionList.length === 0) {
    return null;
  }

  return (
    <SuggestionList
      suggestionList={suggestionList}
      position={state.position}
      onSelect={onSelect}
      onClose={onClose}
    />
  );
}

function SuggestionList({
  suggestionList,
  position,
  onSelect,
  onClose,
}: {
  suggestionList: SuggestionResult[];
  position: SuggestionPosition;
  onSelect: (suggestionResult: SuggestionResult) => void;
  onClose: () => void;
}) {
  const ref = useDetectClickOutside({ onTriggered: onClose });

  const { moveHighlightedItem, selectHighlightedItem, useItem } = useItemList({
    onSelect: (item) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      onSelect(item.value);
    },
  });

  React.useEffect(() => {
    function handleKeydownEvent(event: KeyboardEvent) {
      const { code } = event;

      const preventDefaultCodes = ["ArrowUp", "ArrowDown", "Enter", "Tab"];

      if (preventDefaultCodes.includes(code)) {
        event.preventDefault();
      }

      if (code === "ArrowUp") {
        moveHighlightedItem(-1);
      }

      if (code === "ArrowDown") {
        moveHighlightedItem(1);
      }

      if (code === "Enter" || code === "Tab") {
        selectHighlightedItem();
      }
    }

    document.addEventListener("keydown", handleKeydownEvent);
    return () => {
      document.removeEventListener("keydown", handleKeydownEvent);
    };
  }, [moveHighlightedItem, selectHighlightedItem]);

  return (
    <div
      ref={ref}
      className="absolute max-h-[286px] w-56 overflow-y-auto rounded border bg-forum-primary shadow-lg"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      <ul
        role="listbox"
        className="divide-y divide-forum-primary"
        aria-label="Suggestion List"
      >
        {suggestionList.map((suggestionResult) => (
          <SuggestionResult
            key={suggestionResult.value}
            useItem={useItem}
            suggestionResult={suggestionResult}
          />
        ))}
      </ul>
    </div>
  );
}
function SuggestionResult({
  useItem,
  suggestionResult,
}: {
  useItem: ({ ref, text, value, disabled }: ItemOptions) => {
    id: string;
    index: number;
    highlight: () => void;
    select: () => void;
    selected: unknown;
    // eslint-disable-next-line @typescript-eslint/ban-types
    useHighlighted: () => Boolean;
  };
  suggestionResult: SuggestionResult;
}) {
  const ref = React.useRef<HTMLLIElement>(null);
  const { id, highlight, select, useHighlighted } = useItem({
    ref,
    value: suggestionResult,
  });
  const highlighted = useHighlighted();

  return (
    <li
      ref={ref}
      id={id}
      onMouseEnter={highlight}
      onClick={select}
      role="option"
      aria-selected={highlighted ? "true" : "false"}
      className={classNames(
        "cursor-pointer px-4 py-2 text-left text-sm transition-colors ",
        highlighted ? "bg-blue-600 text-white" : "text-forum-primary"
      )}
    >
      {suggestionResult.label}
    </li>
  );
}
