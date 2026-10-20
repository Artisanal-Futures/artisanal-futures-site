"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUploadFile } from "@better-upload/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, RotateCcw, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import type { StaticPage } from "~/lib/seo/static-pages";
import type { RouterOutputs } from "~/trpc/react";
import { SITE_URL } from "~/lib/seo/site-url";
import {
  pageSeoSchema,
  SEO_DESCRIPTION_TARGET,
  SEO_TITLE_TARGET,
} from "~/lib/validators/seo";
import { api } from "~/trpc/react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Form } from "~/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { ImageUploadFormField } from "~/components/inputs/image-upload-form-field";
import { InputFormField } from "~/components/inputs/input-form-field";
import { SwitchFormField } from "~/components/inputs/switch-form-field";
import { TextareaFormField } from "~/components/inputs/textarea-form-field";
import {
  characterCount,
  SearchResultPreview,
} from "~/components/seo/search-result-preview";

type Override = RouterOutputs["pageSeo"]["list"][number];

type Props = {
  pages: StaticPage[];
  overrides: Override[];
};

const formSchema = pageSeoSchema.extend({
  ogImageFile: z.instanceof(File).optional().nullable(),
});

type FormInput = z.input<typeof formSchema>;
type FormOutput = z.output<typeof formSchema>;

/** Table of the static public pages, each with its /admin/seo override state. */
export function PageOverrides({ pages, overrides }: Props) {
  const [editing, setEditing] = useState<StaticPage | null>(null);
  const byPath = new Map(
    overrides.map((override) => [override.path, override]),
  );

  return (
    <>
      <p className="text-muted-foreground mb-4 text-sm">
        Override the title, description, share image or indexing of a public
        page. Anything left blank keeps the page&apos;s built-in value.
      </p>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Page</TableHead>
              <TableHead>Override</TableHead>
              <TableHead className="w-24 text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pages.map((page) => {
              const override = byPath.get(page.path);
              const changes = override
                ? [
                    override.title && "Title",
                    override.description && "Description",
                    override.ogImage && "Share image",
                    override.noIndex && "Noindex",
                  ].filter((change): change is string => !!change)
                : [];

              return (
                <TableRow key={page.path}>
                  <TableCell>
                    <div className="font-medium">{page.label}</div>
                    <Link
                      href={page.path}
                      target="_blank"
                      className="text-muted-foreground text-xs hover:underline"
                    >
                      {page.path}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {changes.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {changes.map((change) => (
                          <Badge
                            key={change}
                            variant={
                              change === "Noindex" ? "destructive" : "secondary"
                            }
                          >
                            {change}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">
                        Default
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditing(page)}
                    >
                      <Pencil className="mr-1 h-4 w-4" />
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          {editing && (
            <PageOverrideForm
              // Remount per page so the form picks up that page's values.
              key={editing.path}
              page={editing}
              override={byPath.get(editing.path) ?? null}
              onDone={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function PageOverrideForm({
  page,
  override,
  onDone,
}: {
  page: StaticPage;
  override: Override | null;
  onDone: () => void;
}) {
  const router = useRouter();
  const apiUtils = api.useUtils();
  const ogImageInputRef = useRef<HTMLInputElement | null>(null);

  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      path: page.path,
      title: override?.title ?? "",
      description: override?.description ?? "",
      ogImage: override?.ogImage ?? "",
      noIndex: override?.noIndex ?? false,
      ogImageFile: null,
    },
  });

  const onSaved = (message: string, toastId?: string | number) => {
    toast.success(message, { id: toastId });
    void apiUtils.pageSeo.invalidate();
    router.refresh();
    onDone();
  };

  const upsert = api.pageSeo.upsert.useMutation({
    onSuccess: ({ message }, _input, context) =>
      onSaved(message, context?.toastId),
    onError: (error, _input, context) => {
      toast.error(error.message ?? "Failed to save override.", {
        id: context?.toastId,
      });
    },
    onMutate: () => ({
      toastId: toast.loading("Saving override, please wait..."),
    }),
  });

  const remove = api.pageSeo.delete.useMutation({
    onSuccess: ({ message }, _input, context) =>
      onSaved(message, context?.toastId),
    onError: (error, _input, context) => {
      toast.error(error.message ?? "Failed to remove override.", {
        id: context?.toastId,
      });
    },
    onMutate: () => ({
      toastId: toast.loading("Removing override, please wait..."),
    }),
  });

  const imageUploader = useUploadFile({
    api: "/api/upload",
    route: "shopImage",
    onError: (error) => {
      toast.error(error.message ?? "Image upload failed.");
    },
  });

  const handleSubmit = async ({ ogImageFile, ...data }: FormOutput) => {
    let ogImage = data.ogImage;
    if (ogImageFile instanceof File) {
      try {
        const response = await imageUploader.upload(ogImageFile, {
          metadata: { businessSlug: "site" },
        });
        ogImage =
          (response.file.objectInfo.metadata?.pathname as string | undefined) ??
          ogImage;
      } catch {
        toast.error("Failed to upload share image.");
        return;
      }
    }

    upsert.mutate({ ...data, ogImage });
  };

  const isPending =
    upsert.isPending || remove.isPending || imageUploader.isPending;
  const title = form.watch("title");
  const description = form.watch("description");

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => void form.handleSubmit(handleSubmit)(e)}
        className="space-y-6"
      >
        <DialogHeader>
          <DialogTitle>{page.label}</DialogTitle>
          <DialogDescription>
            {page.path}. Blank fields keep the page&apos;s built-in value.
          </DialogDescription>
        </DialogHeader>

        <SearchResultPreview
          title={title?.trim() ? title : page.label}
          url={`${SITE_URL}${page.path}`}
          description={description ?? ""}
          // The homepage title skips the " – Artisanal Futures" suffix.
          absoluteTitle={page.path === "/"}
        />

        <InputFormField
          form={form}
          name="title"
          label="Title"
          placeholder="Built-in title"
          disabled={isPending}
          description={characterCount(title, SEO_TITLE_TARGET)}
        />
        <TextareaFormField
          form={form}
          name="description"
          label="Description"
          placeholder="Built-in description"
          rows={3}
          disabled={isPending}
          description={characterCount(description, SEO_DESCRIPTION_TARGET)}
        />
        <ImageUploadFormField
          form={form}
          name="ogImageFile"
          label="Share image"
          description="1200×630. Defaults to the page's own image or the site default."
          disabled={isPending}
          existingPreviewUrl={override?.ogImage ?? undefined}
          inputRef={ogImageInputRef}
        />
        <SwitchFormField
          form={form}
          name="noIndex"
          label="Hide from search engines"
          description="Adds noindex and drops the page from the sitemap."
          disabled={isPending}
        />

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            disabled={isPending || !override}
            onClick={() => remove.mutate({ path: page.path })}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset to default
          </Button>
          <Button type="submit" disabled={isPending}>
            <Save className="mr-2 h-4 w-4" />
            {isPending ? "Saving..." : "Save override"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
