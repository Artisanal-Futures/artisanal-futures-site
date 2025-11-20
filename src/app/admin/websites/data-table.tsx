"use client";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { PlusIcon, TrashIcon, MailIcon } from "lucide-react";
import { type Shop, WebsiteProvision } from "@prisma/client";

import { api } from "~/trpc/react";
import { DataTable } from "~/components/ui/data-table";
import { ItemDialog } from "~/app/admin/_components/item-dialog";
import { RowCellIdDisplay } from "~/app/admin/_components/row-cell-id-display";
import { SingleActionDialog } from "~/app/admin/_components/single-action-dialog";
import { WebsiteProvisionForm } from "~/components/admin/forms/website-form";
import { Button } from "@/src/components/ui/button";

type ShopWithWebsite = Shop & {
  websiteProvision: WebsiteProvision | null;
};

export const columns: ColumnDef<ShopWithWebsite>[] = [
  {
    accessorKey: "name",
    header: "Business Name",
    cell: ({ row }) => (
      <RowCellIdDisplay id={row.original.id} label = {row.original.name} />
    ),
  },
  {
    accessorKey: "ownerName",
    header: "Owner Name",
    cell: ({ row }) => (
      <span className="text-sm">{row.original.ownerName}</span>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <span className="text-sm">{row.original.email}</span>
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
        <span className="text-sm text-muted-foreground">-</span>
      );
    },
  },
  {
    accessorKey: "domain",
    header: "AF Generated Website",
    cell: ({ row }) => {
      const domain = row.original.websiteProvision?.customDomain;
      const finalDomain = "https://"+domain+"/admin"
      return domain ? (
        <a className="text-sm text-blue-600" href={finalDomain}>{finalDomain}</a>
      ) : (
        <span className="text-sm text-muted-foreground">-</span>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const shop = row.original;
      const utils = api.useUtils();
      const hasWebsiteProvision = !!shop.websiteProvision;
      const deleteMutation = api.websiteProvision.delete.useMutation({
        onSuccess: async() => {
          toast.success("Website provision delete successfully.");
          await utils.shop.getAllWithWebsites.invalidate();
        },
        onError: (error) => {
          toast.error(`Error deleting website provision ${error.message}`);
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
                email: shop.email,
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
              onClick={() => window.location.href = `mailto:${shop.email}`}
              >
                <MailIcon className="mr-1 h-4 w-4" />
                  Email
              </Button>
            <SingleActionDialog 
              title="Delete Website Provision"
              description={`Are you sure you want to delete the website provision for "${shop.name}"? This action cannot be undone.`}
              actionText="Delete"
              onSubmit={() => 
                deleteMutation.mutate({ id: shop.websiteProvision!.id})
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

export function WebsiteProvisionDataTable() {
  const { data, isLoading } = api.shop.getAllWithWebsites.useQuery();

  if (isLoading) {
    return <div>Loading shops...</div>;
  }

  return (
    <DataTable<ShopWithWebsite, unknown>
      columns={columns}
      data={(data as ShopWithWebsite[]) ?? []}
      searchKey="name"
    />
  );
}
