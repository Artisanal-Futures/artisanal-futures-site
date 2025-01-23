import * as Minio from "minio";

import { env } from "~/env";

const minioClient = new Minio.Client({
  endPoint: env.MINIO_ENDPOINT,
  port: undefined, // Default MinIO port
  useSSL: true, // Set to true if you're using HTTPS
  accessKey: env.MINIO_ACCESS_KEY,
  secretKey: env.MINIO_SECRET_KEY,
});

export default minioClient;
