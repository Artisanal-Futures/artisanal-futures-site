import { z } from "zod";
import { env } from "~/env";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { 
    createProvisionSchema,
    cancelProvisionSchema,
} from "./schemas/websiteProvision";
import crypto from "node:crypto";
import { deleteCoolifyDeployment, createCoolifyDeployment, verifyDeployment } from "../services/coolify";

const requireAdmin = (userRole: string | undefined) => {
    if(userRole !== "ADMIN") {
        throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins can perform this action",
        });
    }
}


export const websiteProvisonRouter = createTRPCRouter({
    getShopForProvision: protectedProcedure
        .input(z.object({ shopId: z.string().cuid() }))
        .query(async ({ ctx, input }) => {
            requireAdmin(ctx.session.user.role);

            const shop = await ctx.db.shop.findUnique({
                where: { id: input.shopId },
                include: {
                    owner: true,
                    address: true,
                    websiteProvision: true,
                },
            });
            
            if(!shop){
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Shop not found"
                });
            }

            return {
                shop, 
                hasProvision: !!shop.websiteProvision,
                onboardingData: {
                    businessName: shop.name,
                    ownerName: shop.ownerName,
                    contactEmail: shop.email || shop.owner.email,
                    contactPhone: shop.phone,
                    businessAddress: shop.address ? {
                        street: shop.address.street,
                        city: shop.address.city,
                        state: shop.address.state,
                        zip: shop.address.zip,
                        country: shop.address.country,
                    } : undefined,
                businessTagLine: shop.bio,
                logoUrl: shop.logoPhoto,
                coverUrl: shop.coverPhoto,
                website: shop.website,
                },

            };

        }),

    create: protectedProcedure
        .input(createProvisionSchema)
        .mutation(async ({ctx, input}) => {
            requireAdmin(ctx.session.user.role);

            const adminUser = 'af_admin'
            const adminPassword = generateSecurePassword();

            if(!adminPassword){
                throw new TRPCError ({
                    code: "NOT_FOUND",
                    message: "Password could not be generated"
                });
            }

            const existingProvision = await ctx.db.websiteProvision.findUnique({
                where: { shopId: input.shopId }
            });

            if (existingProvision) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "This shop already has an active website provision",
                });
            }

            const config = {
                ...input.config,
                adminUser,
                adminPassword,
                adminEmail: input.config?.adminEmail || input.contactEmail,
                plugins: input.config?.plugins || [
                    "woocommerce",
                    "better-wp-security",
                    "all-in-one-wp-migration"
                ],
                theme: input.config?.theme || "storefront",
            };

            const provision = await ctx.db.websiteProvision.create({
                data: {
                    userId: input.userId,
                    shopId: input.shopId,
                    framework: input.framework,
                    siteType: input.siteType,
                    status: "PENDING",

                    businessName: input.businessName,
                    contactEmail: input.contactEmail,


                    config: config,
                },
                include: {
                    user: true,
                },
            });
            
            try {
                const coolifyResult = await createCoolifyDeployment(provision);

                // console.log(coolifyResult.domain);

                const isLive = await verifyDeployment(`https://${coolifyResult.domain}`);

                if (!isLive) {
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: "Website deployment failed verification - site is not accessible",
                    });
                }

                const updateProvision = await ctx.db.websiteProvision.update({
                    where: { id: provision.id },
                    data: {
                        status: isLive ? "ACTIVE" : "PROVISIONING",
                        coolifyProjectUuid: coolifyResult.projectUuid,
                        coolifyServiceUuid: coolifyResult.serviceUuid,
                        coolifyServerUuid: coolifyResult.serverUuid,
                        customDomain: coolifyResult.domain,
                        hasCustomDomain: true,
                        adminUser: adminUser,
                        // adminPasswordEncrypted: encryptedPassword,
                    },
                    include: { user: true },
                });

                return updateProvision;
            } catch (coolifyError) {
                await ctx.db.websiteProvision.update({
                    where: { id: provision.id},
                    data: {
                        status: "FAILED",
                        errorMessage: coolifyError instanceof Error ? coolifyError.message : "Unknown error",
                    },
                });
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: `Deployment failed: ${coolifyError instanceof Error ? coolifyError.message : " Unknown"}`,
                });
            }

        }),

    delete: protectedProcedure
        .input(cancelProvisionSchema)
        .mutation(async ({ ctx, input}) =>{
            requireAdmin(ctx.session.user.role);

            const provision = await ctx.db.websiteProvision.findUnique({
                where: { id: input.id },
            });

            if(!provision){
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Provision not found",
                });
            }
            
            if(provision.coolifyServiceUuid && provision.coolifyProjectUuid){
                try {
                    await deleteCoolifyDeployment(provision.coolifyServiceUuid, provision.coolifyProjectUuid);
                } catch (coolifyError) {
                    console.error("Failed to delete from Coolify:", coolifyError);
                }
            }

            await ctx.db.websiteProvision.delete({
                where: { id: input.id },
            });

            return { success: true };
        }),

    // notify: protectedProcedure
    //     .input(notifyArtisanSchema)
    //     .mutation(async ({ ctx, input}) =>{
    //         requireAdmin(ctx.session.user.role);

    //         const provision = await ctx.db.websiteProvision.findUnique({
    //             where: { id: input.id },
    //             include: {
    //                 user: true,
    //                 shop: {
    //                     include: {
    //                         owner: true,
    //                     },
    //                 },
    //             },
    //         });

    //         if(!provision){
    //             throw new TRPCError({
    //                 code: "NOT_FOUND",
    //                 message: "Provision not found",
    //             });
    //         }

    //         if(provision.status !== "ACTIVE") {
    //             throw new TRPCError({
    //                 code: "BAD_REQUEST",
    //                 message: "Can only notify for active provisions",
    //             });
    //         }

    //         const config = provision.config as {
    //             adminUser: string;
    //             adminPassword: string;
    //             adminEmail: string;
    //         };

    //         await ctx.db.websiteProvision.update({
    //             where: { id: input.id },
    //             data: {
    //                 notes: `${provision.notes || ""}\n\n[${new Date().toISOString()}] Artisan Notified`,
    //             },
    //         });

    //         return { 
    //             success: true,
    //             emailData: {
    //                 recipientEmail: provision.shop.owner.email,
    //                 recipientName: provision.shop.ownerName,
    //                 businessName: provision.businessName,
    //                 siteUrl: provision.deploymentUrl,
    //                 loginUrl: `${provision.deploymentUrl}/wp-admin`,
    //                 adminUsername: config.adminUser,
    //                 adminPassword: config.adminPassword,
    //                 customeMessage: input.message,
    //             }, 
    //         };
    //     }),
    });

function generateSecurePassword(length = 32): string {
  return crypto
    .randomBytes(length)
    .toString("base64")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, length);
}

