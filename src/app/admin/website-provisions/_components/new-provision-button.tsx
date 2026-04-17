"use client";

import type { Shop, WebsiteProvision } from "generated/prisma";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sparkles } from "lucide-react";
import { useRouter } from "nextjs-toploader/app";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { api } from "~/trpc/react";
import { useKeyboardEnter } from "~/hooks/use-keyboard-enter";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Form } from "~/components/ui/form";
import { InputFormField } from "~/components/inputs/input-form-field";
import { TextareaFormField } from "~/components/inputs/textarea-form-field";

import { WebsiteProvisionForm } from "./website-provision-form";

type ShopWithWebsite = Shop & {
  websiteProvision: WebsiteProvision | null;
};

export function NewProvisionButton({ shops }: { shops: ShopWithWebsite[] }) {
  const router = useRouter();
  const apiUtils = api.useUtils();
  const [open, setOpen] = useState(false);

  const filteredShops = shops.filter((shop) => !shop.websiteProvision);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="default">
          <Sparkles className="mr-2 h-4 w-4" />
          Add Website Provision
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Website Provision</DialogTitle>
          <DialogDescription>
            Fill out the form to add a new website provision.
          </DialogDescription>
        </DialogHeader>
        <WebsiteProvisionForm
          initialData={null}
          onSuccess={() => {
            setOpen(false);
          }}
          shops={filteredShops ?? []}
        />
      </DialogContent>
    </Dialog>
  );
}
