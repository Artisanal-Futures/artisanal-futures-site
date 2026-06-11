import type { Router } from "@better-upload/server";
import { RejectUpload, route } from "@better-upload/server";
import { toRouteHandler } from "@better-upload/server/adapters/next";

import { env } from "~/env";
import { s3Client } from "~/lib/s3/client";
import { auth } from "~/server/better-auth";

const router: Router = {
  client: s3Client,
  bucketName: env.NEXT_PUBLIC_STORAGE_BUCKET_NAME,
  routes: {
    image: route({
      fileTypes: ["image/*"],
      multipleFiles: false,
      onBeforeUpload: async ({ req, file }) => {
        const user = await auth.api.getSession({ headers: req.headers });
        if (user?.user.role !== "ADMIN") {
          throw new RejectUpload("You are not allowed to upload images.");
        }
        return {
          objectInfo: {
            key: `${file.name}`,
            metadata: {
              pathname: `https://${env.MINIO_ENDPOINT}/${env.NEXT_PUBLIC_STORAGE_BUCKET_NAME}/${file.name}`,
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
        const { businessSlug } = clientMetadata as { businessSlug?: string };

        const user = await auth.api.getSession({ headers: req.headers });
        if (!user) {
          throw new RejectUpload("Not logged in!");
        }

        return {
          objectInfo: {
            key: `${businessSlug ?? "shops"}/${file.name}`,
            metadata: {
              pathname: `https://storage.artisanalfutures.org/${env.NEXT_PUBLIC_STORAGE_BUCKET_NAME}/${businessSlug}/${file.name}`,
            },
          },
        };
      },
      onAfterSignedUrl: async ({ metadata }) => {
        return { metadata: { ...metadata } };
      },
    }),

    postImage: route({
      fileTypes: ["image/*"],
      multipleFiles: false,
      onBeforeUpload: async ({ req, file }) => {
        const user = await auth.api.getSession({ headers: req.headers });
        if (!user) {
          throw new RejectUpload("Not logged in!");
        }
        return {
          objectInfo: {
            key: `${file.name}`,
            metadata: {
              pathname: `https://${env.MINIO_ENDPOINT}/${env.NEXT_PUBLIC_STORAGE_BUCKET_NAME}/posts/${file.name}`,
            },
          },
        };
      },
      onAfterSignedUrl: async ({ metadata }) => {
        return { metadata: { ...metadata } };
      },
    }),

    onboardingArtisan: route({
      fileTypes: ["image/*"],
      multipleFiles: true,
      maxFiles: 2,
      onBeforeUpload: async ({ clientMetadata }) => {
        const { businessSlug } = clientMetadata as { businessSlug?: string };

        return {
          generateObjectInfo: ({ file }) => {
            const key = `$${file.name}`;

            return {
              key,
              metadata: {
                pathName: `https://${env.NEXT_PUBLIC_STORAGE_URL}/${env.NEXT_PUBLIC_STORAGE_BUCKET_NAME}/${businessSlug}/${file.name}`,
              },
            };
          },
        };
      },
    }),

    onboardingImage: route({
      fileTypes: ["image/*"],
      multipleFiles: false,
      onBeforeUpload: async ({ file, clientMetadata }) => {
        const { businessSlug } = clientMetadata as { businessSlug?: string };

        return {
          objectInfo: {
            key: `${businessSlug ?? "shops"}/${file.name}`,
            metadata: {
              pathname: `https://${env.MINIO_ENDPOINT}/${env.NEXT_PUBLIC_STORAGE_BUCKET_NAME}/${businessSlug}/${file.name}`,
            },
          },
        };
      },
      onAfterSignedUrl: async ({ metadata }) => {
        return { metadata: { ...metadata } };
      },
    }),
  },
};
export const { POST } = toRouteHandler(router);
