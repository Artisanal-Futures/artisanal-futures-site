import type { ImportSource } from '~/app/admin/product-migration/_validators/schema'

export function formatDataBySource(source: ImportSource, data: unknown[]) {
  switch (source) {
    case 'shopify':
      return data.map((item) => ({
        name: item.title,
        description: item.body_html,
        price: parseFloat(item.variants[0].price),
        // Add other relevant fields
      }))

    case 'squarespace':
      return data.map((item) => ({
        name: item.name,
        description: item.description,
        price: item.price.value,
        // Add other relevant fields
      }))

    case 'wordpress':
      return data.map((item) => ({
        name: item.name,
        description: item.description,
        price: parseFloat(item.price),
        // Add other relevant fields
      }))

    case 'manual':
      return data // Assuming the manual format already matches your schema

    default:
      throw new Error('Unsupported import source')
  }
}
