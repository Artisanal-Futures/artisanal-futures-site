import { createUploadRouteHandler, route } from 'better-upload/server'

import { s3Client } from '~/lib/file-upload/clients/s3'

export const { POST } = createUploadRouteHandler({
  client: s3Client,
  bucketName: 'products',
  routes: {
    products: route({
      fileTypes: ['image/*'],
    }),
  },
})
