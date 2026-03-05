import type { Router } from "@better-upload/server";
import { RejectUpload, route } from "@better-upload/server";
import { toRouteHandler } from "@better-upload/server/adapters/next";

import { s3Client } from "~/lib/s3/client";

const router: Router = {
  client: s3Client,
  bucketName: "products",
  routes: {
    products: route({
      fileTypes: ["image/*"],
    }),
  },
};
export const { POST } = toRouteHandler(router);
