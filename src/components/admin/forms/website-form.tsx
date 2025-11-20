"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { type Category, CategoryType, SiteType } from "@prisma/client";
import { toast } from "sonner";

import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

const WebsiteProvisionFormSchema = z.object({
    ownerId: z.string().cuid(),
    shopId: z.string().cuid(),
    websiteType: z.nativeEnum(SiteType),
    businessName: z.string().min(1, "Business name is required"),
    contactEmail: z.string().email("Invalid email address"),
});

type WebsiteProvisionFormValues = z.infer<typeof WebsiteProvisionFormSchema>;

interface WebsiteProvisionFormProps {
    initialData?: {
        ownerId?: string;
        shopId: string;
        name?: string;
        email?: string;
    } | null;
    onSuccess?: () => void;
}

export function WebsiteProvisionForm({
    initialData,
    onSuccess
}: WebsiteProvisionFormProps) {
    const utils = api.useUtils();
    const form = useForm<WebsiteProvisionFormValues>({
        resolver: zodResolver(WebsiteProvisionFormSchema),
        defaultValues: {
            ownerId: initialData?.ownerId ?? "",
            shopId: initialData?.shopId ?? "",
            websiteType: "ECOMMERCE",
            businessName: initialData?.name ?? "",
            contactEmail: initialData?.email ?? "",
        },
    });

    const createMutation = api.websiteProvision.create.useMutation({
        onSuccess: async()=> {
            toast.success("Website provision created successfully!");
            await utils.shop.getAllWithWebsites.invalidate();
            onSuccess?.();
        },
        onError: (error) => {
            toast.error(`Error creating website provision: ${error.message}`);
        },
    });

    const onSubmit = (data: WebsiteProvisionFormValues) => {
        createMutation.mutate({
            shopId: data.shopId,
            userId: data.ownerId,
            siteType: data.websiteType,
            framework: "WORDPRESS" as const,
            businessName: data.businessName,
            contactEmail: data.contactEmail,
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="websiteType"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Website Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select website type" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value={SiteType.ECOMMERCE}>E-commerce</SelectItem>
                                    <SelectItem value={SiteType.BLOG}>Blog</SelectItem>
                                    <SelectItem value={SiteType.PORTFOLIO}>Portfolio</SelectItem>
                                    <SelectItem value={SiteType.BUSINESS}>Business</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage/>
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="businessName"
                    render={({ field }) =>
                        <FormItem>
                            <FormLabel>Business Name</FormLabel>
                            <FormControl>
                                <Input 
                                    placeholder="Enter business name"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage/>
                        </FormItem>
                    }
                />
                <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) =>
                        <FormItem>
                            <FormLabel>Contact Email</FormLabel>
                            <FormControl>
                                <Input 
                                    type="email"
                                    placeholder="contact@business.com"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage/>
                        </FormItem>
                    }
                />
                <div className="flex justify-end space-x-4">
                    <Button type="submit" disabled={createMutation.isPending}>
                        {createMutation.isPending ? "Creating..." : "Create Website"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}