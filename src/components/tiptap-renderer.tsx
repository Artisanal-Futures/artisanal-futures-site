"use client";

import { useMemo } from "react";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";

/** TipTap document JSON — matches first parameter of generateHTML */
export type TiptapJSON = Parameters<typeof generateHTML>[0];

type TiptapRendererProps = {
  content: TiptapJSON | null | undefined;
  className?: string;
};

const extensions = [
  StarterKit,
  Link,
  Image,
  Underline,
  TextStyle,
  TextAlign.configure({
    types: ["heading", "paragraph"],
  }),
];

/** TipTap node (minimal shape we need for content walk). */
type ContentNode = {
  type?: string;
  attrs?: Record<string, unknown>;
  content?: ContentNode[];
};

export function TiptapRenderer({ content, className }: TiptapRendererProps) {
  const elements = useMemo(() => {
    if (
      !content ||
      typeof content !== "object" ||
      !Array.isArray((content as { content?: ContentNode[] }).content)
    ) {
      return [];
    }

    const nodes = (content as { content: ContentNode[] }).content;
    return nodes.map((node, index) => {
      try {
        const html = generateHTML(
          {
            type: "doc",
            content: [node] as Parameters<typeof generateHTML>[0]["content"],
          },
          extensions,
        );
        return <div key={index} dangerouslySetInnerHTML={{ __html: html }} />;
      } catch {
        return null;
      }
    });
  }, [content]);

  return <div className={className}>{elements}</div>;
}
