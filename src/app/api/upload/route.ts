import type { Router } from "@better-upload/server";
import { RejectUpload, route } from "@better-upload/server";
import { toRouteHandler } from "@better-upload/server/adapters/next";

import { env } from "~/env";
import { s3Client } from "~/lib/s3/client";
import { auth } from "~/server/better-auth";
import { db } from "~/server/db";

const router: Router = {
  client: s3Client,
  bucketName: env.NEXT_PUBLIC_STORAGE_BUCKET_NAME,
  routes: {
    image: route({
      fileTypes: ["image/*"],
      multipleFiles: false,
      onBeforeUpload: async ({ req, file }) => {
        const user = await auth.api.getSession({ headers: req.headers });
        if (!user || user.user.role !== "ADMIN") {
          throw new RejectUpload("You are not allowed to upload images.");
        }
        return {
          objectInfo: {
            key: `${file.name}`,
            metadata: {
              pathname: `https://${env.NEXT_PUBLIC_STORAGE_URL}/${env.NEXT_PUBLIC_STORAGE_BUCKET_NAME}/${file.name}`,
            },
          },
        };
      },
      onAfterSignedUrl: async ({ metadata }) => {
        return { metadata: { ...metadata } };
      },
    }),

    shopImage: route({
      fileTypes: ["image/*"],
      multipleFiles: false,
      onBeforeUpload: async ({ req, file, clientMetadata }) => {
        const { businessId } = clientMetadata as { businessId?: string };

        const user = await auth.api.getSession({ headers: req.headers });
        if (!user) {
          throw new RejectUpload("Not logged in!");
        }
        const business = businessId
          ? await db.shop.findUnique({ where: { id: businessId } })
          : await db.shop.findFirst({ where: { ownerId: user.user.id } });

        if (!business) {
          throw new RejectUpload("Shop not found. Upload failed.");
        }

        return {
          objectInfo: {
            key: `${businessId}/${file.name}`,
            metadata: {
              pathname: `https://${env.NEXT_PUBLIC_STORAGE_URL}/${env.NEXT_PUBLIC_STORAGE_BUCKET_NAME}/${business.id}/${file.name}`,
            },
          },
        };
      },
      onAfterSignedUrl: async ({ metadata }) => {
        return { metadata: { ...metadata } };
      },
    }),

    // images: route({
    //   fileTypes: ["image/*"],
    //   multipleFiles: true,
    //   maxFiles: 5,
    //   onBeforeUpload: async ({ req }) => {
    //     const user = await auth.api.getSession({ headers: req.headers });

    //     if (!user || user.user.role === "USER" || user.user.role === "GUEST") {
    //       throw new RejectUpload("You are not allowed to upload images.");
    //     }

    //     const business = await checkBusiness();

    //     if (!business) {
    //       throw new RejectUpload("Business not found!");
    //     }

    //     return {
    //       generateObjectInfo: ({ file }) => {
    //         const key = `${business.id}/${file.name}`;

    //         return {
    //           key,
    //           metadata: {
    //             pathName: `https://${env.NEXT_PUBLIC_STORAGE_URL}/business-sites/${business.id}/${file.name}`,
    //           },
    //         };
    //       },
    //     };
    //   },
    // }),
  },
};
export const { POST } = toRouteHandler(router);
