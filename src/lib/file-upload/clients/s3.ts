import { S3Client } from "@aws-sdk/client-s3";

import { env } from "~/env";

export const s3Client = new S3Client({
  region: "us-east-1",
  credentials: {
    accessKeyId: env.MINIO_ACCESS_KEY,
    secretAccessKey: env.MINIO_SECRET_KEY,
  },
  endpoint: `https://${env.MINIO_ENDPOINT}`,
  forcePathStyle: true, // this is an important part for minio
});
