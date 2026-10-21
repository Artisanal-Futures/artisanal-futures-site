"use client";

import type { UseFormReturn } from "react-hook-form";

import type { ShopFormData } from "~/lib/validators/shop";
import { shopPath } from "~/lib/seo/paths";
import { SITE_URL } from "~/lib/seo/site-url";
import { slugify } from "~/lib/utils";
import { SEO_DESCRIPTION_TARGET, SEO_TITLE_TARGET } from "~/lib/validators/seo";
import { Badge } from "~/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { ImageUploadFormField } from "~/components/inputs/image-upload-form-field";
import { InputFormField } from "~/components/inputs/input-form-field";
import { SwitchFormField } from "~/components/inputs/switch-form-field";
import { TextareaFormField } from "~/components/inputs/textarea-form-field";
import {
  characterCount,
  SearchResultPreview,
} from "~/components/seo/search-result-preview";

type SeoShop = {
  id: string;
  slug: string | null;
  seoImage: string | null;
} | null;

type FieldsProps = {
  form: UseFormReturn<ShopFormData>;
  shop: SeoShop;
  disabled?: boolean;
};

type PreviewProps = FieldsProps & {
  seoImageInputRef: React.RefObject<HTMLInputElement | null>;
};

/** The first value that isn't blank, trimmed. */
function firstNonBlank(...values: (string | null | undefined)[]) {
  return values.map((value) => value?.trim()).find(Boolean) ?? null;
}

/** Live values derived from the form, shared by the fields and preview cards. */
function useShopSeoDerived(form: UseFormReturn<ShopFormData>, shop: SeoShop) {
  const name = form.watch("name");
  const description = form.watch("description");
  const bio = form.watch("bio");
  const seo = form.watch("seo");

  // What the URL will be after saving: the typed slug, else the current one,
  // else the one the server derives from the name.
  const effectiveSlug =
    firstNonBlank(seo?.slug, shop?.slug, slugify(name ?? "")) ?? "your-shop";
  const url = `${SITE_URL}${shopPath({ id: shop?.id ?? "", slug: effectiveSlug })}`;
  const slugChanged = !!shop?.slug && !!seo?.slug && seo.slug !== shop.slug;

  return {
    name,
    seo,
    effectiveSlug,
    url,
    slugChanged,
    previewTitle: firstNonBlank(seo?.seoTitle, name) ?? "Shop name",
    previewDescription:
      firstNonBlank(seo?.seoDescription, description, bio) ?? "",
  };
}

/**
 * Admin-only slug and search/share overrides for a shop. Only rendered for
 * admins; the server also rejects these fields from anyone else.
 */
export function ShopSeoFieldsCard({ form, shop, disabled }: FieldsProps) {
  const { name, seo, effectiveSlug, slugChanged } = useShopSeoDerived(
    form,
    shop,
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>Search &amp; sharing</CardTitle>
          <Badge variant="secondary">Admin only</Badge>
        </div>
        <CardDescription>
          How this shop appears in search results and link previews. Leave a
          field blank to use what the profile already says.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <InputFormField
          form={form}
          name="seo.slug"
          label="URL slug"
          placeholder={shop?.slug ?? slugify(name ?? "")}
          disabled={disabled}
          description={
            slugChanged
              ? `New URL: /shops/${seo?.slug}. /shops/${shop?.slug} will redirect to it.`
              : `URL: /shops/${effectiveSlug}. Lowercase letters, numbers and hyphens.`
          }
        />

        <InputFormField
          form={form}
          name="seo.seoTitle"
          label="SEO title"
          placeholder={name}
          disabled={disabled}
          description={characterCount(seo?.seoTitle, SEO_TITLE_TARGET)}
        />

        <TextareaFormField
          form={form}
          name="seo.seoDescription"
          label="SEO description"
          placeholder="Defaults to the shop description"
          disabled={disabled}
          rows={3}
          description={characterCount(
            seo?.seoDescription,
            SEO_DESCRIPTION_TARGET,
          )}
        />

        <SwitchFormField
          form={form}
          name="seo.seoNoIndex"
          label="Hide from search engines"
          description="Adds noindex and drops the shop from the sitemap. The page stays visible to visitors."
          disabled={disabled}
        />
      </CardContent>
    </Card>
  );
}

/** Search result preview and the share image, for the Search & sharing aside. */
export function ShopSeoPreviewCard({
  form,
  shop,
  disabled,
  seoImageInputRef,
}: PreviewProps) {
  const { url, previewTitle, previewDescription } = useShopSeoDerived(
    form,
    shop,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preview</CardTitle>
        <CardDescription>
          How links to this shop look in search results and when shared.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <SearchResultPreview
          title={previewTitle}
          url={url}
          description={previewDescription}
        />

        <ImageUploadFormField
          form={form}
          name="seoImageFile"
          label="Share image"
          description="Shown when the shop is shared on social media (1200×630 works best). Defaults to the cover photo, then the logo."
          disabled={disabled}
          existingPreviewUrl={shop?.seoImage ?? undefined}
          inputRef={seoImageInputRef}
        />
      </CardContent>
    </Card>
  );
}
