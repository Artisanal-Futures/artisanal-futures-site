/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use client";

import type EditorJS from "@editorjs/editorjs";
import type { z } from "zod";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import TextareaAutosize from "react-textarea-autosize";

import { PostValidator } from "~/lib/validators/post";

import "~/styles/editor.css";

import { useUploadFile } from "@better-upload/client";
import { toast } from "sonner";

import { api } from "~/trpc/react";

type FormData = z.infer<typeof PostValidator>;

type Props = { subredditId: string };

export const Editor: React.FC<Props> = ({ subredditId }) => {
  const imageUploader = useUploadFile({
    api: "/api/upload",
    route: "postImage",
    onError: (error) => {
      toast.error(error.message ?? "Image upload failed.");
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(PostValidator),
    defaultValues: {
      subredditId,
      title: "",
      content: null,
    },
  });
  const ref = useRef<EditorJS | undefined>(undefined);
  const _titleRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const pathname = usePathname();
  const apiUtils = api.useUtils();

  const createSubredditPost =
    api.forumSubreddit.createSubredditPost.useMutation({
      onError: () =>
        toast.error("Your post was not published. Please try again."),
      onSuccess: () => {
        const newPathname = pathname.split("/").slice(0, -1).join("/");
        router.push(newPathname);

        toast.success("Your post has been published.");
        void apiUtils.forumSubreddit.invalidate();
        void apiUtils.forum.invalidate();

        router.refresh();
      },
    });

  const initializeEditor = useCallback(async () => {
    const EditorJS = (await import("@editorjs/editorjs")).default;
    const Header = (await import("@editorjs/header")).default;
    const Embed = (await import("@editorjs/embed")).default;
    const Table = (await import("@editorjs/table")).default;
    const List = (await import("@editorjs/list")).default;
    const Code = (await import("@editorjs/code")).default;
    const LinkTool = (await import("@editorjs/link")).default;
    const InlineCode = (await import("@editorjs/inline-code")).default;
    const ImageTool = (await import("@editorjs/image")).default;

    if (!ref.current) {
      const editor = new EditorJS({
        holder: "editor",
        onReady() {
          ref.current = editor;
        },
        placeholder: "Type here to write your post...",
        inlineToolbar: true,
        data: { blocks: [] },
        tools: {
          header: Header,
          linkTool: {
            class: LinkTool,
            config: {
              endpoint: "/api/link",
            },
          },
          image: {
            class: ImageTool,
            config: {
              uploader: {
                async uploadByFile(file: File) {
                  let imageUrl: string | undefined = undefined;
                  const imageFile = file;
                  if (imageFile instanceof File) {
                    try {
                      const response = await imageUploader.upload(imageFile);
                      const fileLocation =
                        (response.file.objectInfo.metadata?.pathname as
                          | string
                          | undefined) ?? "";
                      if (fileLocation) imageUrl = fileLocation;
                    } catch {
                      toast.error("Failed to upload post image.");
                      return;
                    }
                  }

                  return {
                    success: 1,
                    file: { url: imageUrl },
                  };
                },
              },
            },
          },
          list: List,
          code: Code,
          inlineCode: InlineCode,
          table: Table,
          embed: Embed,
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (Object.keys(errors).length) {
      for (const [, value] of Object.entries(errors)) {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        (value as { message: string }).message;
        toast.error((value as { message: string }).message);
      }
    }
  }, [errors]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMounted(true);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await initializeEditor();

      setTimeout(() => {
        _titleRef?.current?.focus();
      }, 0);
    };

    if (isMounted) {
      void init();

      return () => {
        if (ref.current) {
          ref.current.destroy();
          ref.current = undefined;
        }
      };
    }
  }, [isMounted, initializeEditor]);

  async function onSubmit(data: FormData) {
    const blocks = await ref.current?.save();

    createSubredditPost.mutate({
      title: data.title,
      content: blocks,
      subredditId,
    });
  }

  if (!isMounted) {
    return null;
  }

  const { ref: titleRef, ...rest } = register("title");

  return (
    <div className="border-border bg-background w-full rounded-lg border p-4">
      <form
        id="subreddit-post-form"
        className="w-fit"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="prose prose-stone dark:prose-invert">
          <TextareaAutosize
            ref={(e) => {
              titleRef(e);

              _titleRef.current = e;
            }}
            {...rest}
            placeholder="Title"
            className="w-full resize-none appearance-none overflow-hidden bg-transparent text-5xl font-bold focus:outline-none"
          />
          <div id="editor" className="min-h-[500px]" />
          <p className="text-sm text-gray-500">
            Use{" "}
            <kbd className="bg-muted rounded-md border px-1 text-xs uppercase">
              Tab
            </kbd>{" "}
            to open the command menu.
          </p>
        </div>
      </form>
    </div>
  );
};
