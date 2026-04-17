"use client";

import type { Shop, WebsiteProvision } from "generated/prisma";
import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { MailIcon, TrashIcon } from "lucide-react";
import { toast } from "sonner";

import type { RouterOutputs } from "~/trpc/react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { DataTable } from "~/components/ui/data-table";
import { ItemDialog } from "~/app/admin/_components/item-dialog";
import { RowCellIdDisplay } from "~/app/admin/_components/row-cell-id-display";
import { SingleActionDialog } from "~/app/admin/_components/single-action-dialog";

import { WebsiteProvisionForm } from "./website-provision-form";

type ShopWithWebsite = Shop & {
  websiteProvision: WebsiteProvision | null;
};

export const columns: ColumnDef<ShopWithWebsite>[] = [
  {
    accessorKey: "name",
    header: "Business",
    cell: ({ row }) => (
      <div className="flex flex-col space-y-1">
        <span>{row.original.name}</span>
        <span className="text-muted-foreground text-xs">
          Owner: {row.original.ownerName}
        </span>
      </div>
    ),
  },

  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <span className="text-sm">
        {row.original.websiteProvision?.contactEmail}
      </span>
    ),
  },
  {
    accessorKey: "website",
    header: "Website",
    cell: ({ row }) => {
      const website = row.original.website;
      return website ? (
        <a
          href={website}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:underline"
        >
          {website}
        </a>
      ) : (
        <span className="text-muted-foreground text-sm">-</span>
      );
    },
  },
  {
    accessorKey: "domain",
    header: "AF Generated Website",
    cell: ({ row }) => {
      const domain = row.original.websiteProvision?.customDomain;
      const finalDomain = "https://" + domain + "/admin";
      return domain ? (
        <a className="text-sm text-blue-600" href={finalDomain}>
          {finalDomain}
        </a>
      ) : (
        <span className="text-muted-foreground text-sm">-</span>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const shop = row.original;
      const utils = api.useUtils();
      const hasWebsiteProvision = !!shop.websiteProvision;
      // const router = useRouter();
      const deleteMutation = api.websiteProvision.delete.useMutation({
        onSuccess: () => {
          toast.dismiss();
          toast.success("Website provision delete successfully.");
          void utils.websiteProvision.invalidate();
        },
        onError: (error) => {
          toast.dismiss();
          toast.error(`Error deleting website provision ${error.message}`);
        },
        onSettled: () => {
          void utils.shop.getAllWithWebsites.invalidate();
        },
        onMutate: () => {
          toast.loading("Deleting website provision...");
        },
      });
      return (
        <div className="flex items-center justify-end space-x-2">
          {!hasWebsiteProvision ? (
            <ItemDialog
              id={shop.id}
              title="Create Website Provision (May take up to 5 minutes)"
              subtitle={`Create a new website for ${shop.name}`}
              initialData={{
                ownerId: shop.ownerId,
                shopId: shop.id,
                name: shop.name,
                email: shop.email ?? "",
              }}
              FormComponent={WebsiteProvisionForm}
              mode="create"
            />
          ) : (
            <>
              <Button
                className="h-8 text-xs"
                size="sm"
                variant="default"
                onClick={() => (window.location.href = `mailto:${shop.email}`)}
              >
                <MailIcon className="mr-1 h-4 w-4" />
                Email
              </Button>
              <SingleActionDialog
                title="Delete Website Provision"
                description={`Are you sure you want to delete the website provision for "${shop.name}"? This action cannot be undone.`}
                actionText="Delete"
                onSubmit={() =>
                  deleteMutation.mutate({ id: shop.websiteProvision!.id })
                }
                isLoading={deleteMutation.isPending}
                icon={TrashIcon}
                color="red"
              />
            </>
          )}
        </div>
      );
    },
  },
];

type Props = {
  websiteProvisions: RouterOutputs["shop"]["getAllWithWebsites"];
};

export function WebsiteProvisionDataTable({ websiteProvisions }: Props) {
  return (
    <DataTable<ShopWithWebsite, unknown>
      columns={columns}
      data={(websiteProvisions as ShopWithWebsite[]) ?? []}
      searchKey="name"
    />
  );
}
