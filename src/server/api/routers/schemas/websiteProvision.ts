import  { z } from "zod";

export const createProvisionSchema = z.object({
    userId: z.string().cuid(),
    shopId: z.string().cuid(),
    framework: z.enum(["WORDPRESS", "NEXTJS", "GHOST", "STRAPI"]),
    siteType: z.enum(["ECOMMERCE", "BLOG", "PORTFOLIO", "LANDING_PAGE", "BUSINESS", "CUSTOM"]),

    hasCustomDomain: z.boolean().default(false),
    customDomain: z.string().optional(),
    subdomain: z.string().optional(),

    businessName: z.string().min(1),
    contactEmail: z.string().email(),
    businessTagLine: z.string().optional(),
    contactPhone: z.string().optional(),
    businessAddress: z.record(z.any()).optional(),
       

    socialLinks: z.record(z.any()).optional(),

    config: z.object({
        adminUser: z.string().optional(),
        adminPassword: z.string().optional(),
        adminEmail: z.string().optional(),
        plugins: z.array(z.string()).optional(),
        theme: z.string().optional(),
        woocommerce: z.object({
            currency: z.string().default("USD"),
            timezone: z.string().optional(),
        }).optional(),
    }).optional().default({}),

    cpuLimit: z.string().optional(),
    memoryLimit: z.string().optional(),

    notes: z.string().optional(),
    isTest: z.boolean().default(false),
});

export const cancelProvisionSchema = z.object({
    id: z.string().cuid(),
    reason: z.string().optional(),
});

export const notifyArtisanSchema = z.object({
    id: z.string().cuid(),
    message: z.string().optional(),
});

export const wordpressConfigSchema = z.object({
    adminUser: z.string().optional(),
    adminPassword: z.string().optional(),
    adminEmail: z.string().optional(),
    plugins: z.array(z.string()).optional(),
    theme: z.string().optional(),
    woocommerce: z.object({
        currency: z.string().default("USD"),
        timezone: z.string().optional(),
    }).optional(),
});